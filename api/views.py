from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse
import ee
import json, fiona
import os
from api.utils import *
from api.config import LEVELS, FIELDS
from accounts.models import Profile
from subscribe.utils import getSubscribedRegions

# view to get composite image between two dates
def getCompositeImage(request):
    try:
        # parse request parameters
        minp = int(request.GET.get('minp'))/100.
        maxp = int(request.GET.get('maxp'))/100.
        miny = request.GET.get('miny')
        maxy = request.GET.get('maxy')
        authGEE()
        image = getComposite(minp, maxp, miny, maxy)
        resp = getDefaultStyled(image)
        resp['params'] = [minp, maxp, miny, maxy]
        return JsonResponse(resp)
    except TypeError as e:
        print(e)
        # return redirect('login')

# view to get a single image (prediction) of a certain date
def getSingleImage(request):
    authGEE()
    date = ee.Date(request.GET.get('id'))
    ic = ee.ImageCollection(IMAGE_REPO)\
           .select('conf20')\
           .filterBounds(ee.Geometry.Point([104.77,12.60]))\
           .filterDate(date, date.advance(1,'second'))
    img = ic.first().selfMask()
    visparams = {'palette':['ff0000']}
    mapid = ee.data.getTileUrl(img.getMapId(visparams),0,0,0)[:-5]+'{z}/{x}/{y}'
    resp = {'url':mapid,'visparams':visparams}
    return JsonResponse(resp)

# get get the dates of available images
def getImageNames(request):
    authGEE()
    ic = ee.ImageCollection(IMAGE_REPO)\
           .select('conf20')\
           .filterBounds(ee.Geometry.Point([104.77,12.60]))
    
    def imageToDate(image):
        image = ee.Image(image)
        return ee.Date(image.get('system:time_start')).format('YYYY-MM-dd')

    return JsonResponse({'ids':ic.toList(ic.size()).map(imageToDate).getInfo()})

# get the names of features (municipality) and their bounding boxes
def getFeatureNames(request):
    module_dir = os.path.dirname(__file__)
    f = open(os.path.join(module_dir,'shapes','featureNames.json'),'r').read()
    return JsonResponse(json.loads(f))

# get features in a cascading pattern
def getCascadingFeatureNames(request):
    authGEE()
    fc = ee.FeatureCollection(MUNICIPAL_BOUNDS)
    fclist = fc.toList(fc.size())

    def getCascadingList(feature, passedObject):
        passedObject = ee.Dictionary(passedObject)
        feature = ee.Feature(feature)
        l1 = feature.get('admin1Name')
        l2 = feature.get('admin2Name')
        subset = passedObject.get(l1, False)
        list = ee.Algorithms.If(subset,ee.List(subset).add(l2),[l2])
        return passedObject.set(l1,list)

    fci = fclist.iterate(getCascadingList, {})

    return JsonResponse(fci.getInfo())

# get features in a geojson format
def getFeatures(request):
    module_dir = os.path.dirname(__file__)
    focus = request.GET.get('focus')
    try:
        level = int(request.GET.get('level'))
    except Exception as e:
        level = 0
    if (level == 0):
        level0 = fiona.open(os.path.join(module_dir,'shapes','Level0.shp'))
        return JsonResponse(next(iter(level0)));
    elif (level == 1):
        level1 = fiona.open(os.path.join(module_dir,'shapes','Level1.shp'))
        fcoll = {'type':'FeatureCollection', 'features':[]}
        for feature in level1:
            fcoll['features'].append(feature);
        return JsonResponse(fcoll);
    elif (level == 2):
        level2 = fiona.open(os.path.join(module_dir,'shapes','Level2.shp'))
        fcoll = {'type':'FeatureCollection', 'features':[]}
        for feature in level2:
            if (feature['properties']['admin1Name']==focus):
                fcoll['features'].append(feature)
        return JsonResponse(fcoll)

def getGEETiles(request):
    mapid = ''
    style = {}
    name = request.GET.get('name')
    if (name == "provinces"):
        table = ee.FeatureCollection('users/nyeinsoethwal/Cambodia/cambodia_boundary')
        style = {'color':'#f66', 'fillColor':'#0000', 'width':3}
        layer = table.style(color=style['color'],fillColor=style['fillColor'],width=style['width'])
        mapid = ee.data.getTileUrl(layer.getMapId(),0,0,0)[:-5]+'{z}/{x}/{y}'
    elif (name == "grid"):
        table = ee.FeatureCollection('projects/servir-mekong/CambodiaPAMP/grid')
        style = {'color':'#666', 'fillColor':'#0000', 'width':3}
        layer = table.style(color=style['color'],fillColor=style['fillColor'],width=style['width'])
        mapid = ee.data.getTileUrl(layer.getMapId(),0,0,0)[:-5]+'{z}/{x}/{y}'
    elif (name == "annualfloss"):
        img = ee.Image('UMD/hansen/global_forest_change_2019_v1_7')
        style = {'bands':['lossyear'],'palette':['ff0000','ff6600','ffb366','ffd11a'],'min':16,'max':19}
        mapid = ee.data.getTileUrl(img.getMapId(style),0,0,0)[:-5]+'{z}/{x}/{y}'
    return JsonResponse({'url':mapid,'style':style})

# get the downloadurl for images
def getDownloadURL(request):
    region = request.GET.get('region')
    level = request.GET.get('level')
    date = request.GET.get('date')
    if (region and date and region != 'undefined' and date!='undefined'):
        authGEE()
        img = ee.Image(IMAGE_REPO+'/'+date)
        if (region == 'all'):
            region = ee.FeatureCollection(LEVELS['l0'])
        else:
            l1, l2 = region.split("_");
            region = ee.FeatureCollection(LEVELS[level])\
                        .filter(ee.Filter.eq(FIELDS['mun_l1'],l1.upper()))\
                        .filter(ee.Filter.eq(FIELDS['mun'],l2.upper()))
        img = img.clip(region)
        url = img.toByte().getDownloadURL({})
        return JsonResponse({'action':'success', 'url':url})
    else:
        return JsonResponse({'action':'error','message':'Insufficient Parameters! Malformed URL!'}, status=500)

# get area of predicted mineswithin study region
def getAreaPredicted(request):
    user = request.user
    date = request.GET.get('date')
    if not(user.is_authenticated):
        return requestLogin(request)
    else:
        try:
            user = Profile.objects.get(user=user)
            regions = getSubscribedRegions(user)
            authGEE()
            fc = subscribedRegionsToFC(regions)
            image = ee.Image(IMAGE_REPO+'/'+date)
            pa = ee.Image.pixelArea()
            image = image.selfMask().multiply(pa)
            rr = image.reduceRegions(collection=fc,
                reducer=ee.Reducer.sum(),
                scale=500,
                crs='EPSG:4326')
            area = rr.aggregate_array('sum')
            names = rr.aggregate_array('MPIO_CNMBR')
            dict = ee.Dictionary({'area':area,'names':names}).getInfo()
            dict['action'] = 'Success'
            return JsonResponse(dict)
        except Exception as e:
            print(e)
            return JsonResponse({'action':'Error','message':'Something went wrong!'},status=500)

# get area of predicted mineswithin study region
def getAreaPredictedTS(request):
    user = request.user
    if not(user.is_authenticated):
        return requestLogin(request)
    else:
        try:
            user = Profile.objects.get(user=user)
            regions = getSubscribedRegions(user)
            authGEE()
            fc = subscribedRegionsToFC(regions)
            # print(fc.getInfo())

            def asBands(image, passedImage):
                image = ee.Image(image)
                id = image.id()
                pa = ee.Image.pixelArea()
                image = image.selfMask().multiply(pa)
                passedImage = ee.Image(passedImage)
                return passedImage.addBands(image.rename(id))
            image =  ee.Image(ee.ImageCollection(IMAGE_REPO).iterate(asBands,ee.Image()))
            image = image.select(image.bandNames().remove('constant'))
            rr = image.reduceRegion(geometry=fc.geometry(),
                reducer=ee.Reducer.sum(),
                scale=500,
                crs='EPSG:4326',
                bestEffort=True)
            area = rr.values()
            names = rr.keys()
            dict = ee.Dictionary({'area':area,'names':names}).getInfo()
            dict['action'] = 'Success'
            return JsonResponse(dict)
        except Exception as e:
            print(e)
            return JsonResponse({'action':'Error','message':'Something went wrong!'},status=500)

def getInfo(request):
    try:
        lat = float(request.GET.get('lat'))
        lng = float(request.GET.get('lon'))
        image = request.GET.get('image')
        authGEE()
        image = ee.Image(IMAGE_REPO+'/'+image)
        dist = ee.FeatureCollection(LEVELS['mun'])
        point = ee.Geometry.Point(lng,lat)
        pt = image.sampleRegions(ee.Feature(point))
        f = dist.filterBounds(point)
        classval = ee.Algorithms.If(pt.size().gt(0),pt.first().get('cmap'),0)
        admnames = ee.Algorithms.If(f.size().gt(0),[f.first().get('NOMBDEP'),
                                                f.first().get('NOMBPROV'),
                                                f.first().get('NOMBDIST')],[False,False,False])
        
        vals = ee.List([classval]).cat(admnames).getInfo()
        return JsonResponse({'action':'Success','value':vals})
    except Exception as e:
        print(e)
        return JsonResponse({'action':'Error','message':'Something went wrong!'},status=500)