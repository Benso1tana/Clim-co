import * as L from 'leaflet';

declare module 'leaflet' {
  namespace HeatLayer {
    interface HeatLayerOptions {
      minOpacity?: number;
      maxZoom?: number;
      max?: number;
      radius?: number;
      blur?: number;
      gradient?: {[key: number]: string};
    }
  }
  
  class HeatLayer extends L.Layer {
    constructor(latlngs: Array<[number, number, number]> | Array<L.LatLng> | Array<L.LatLng[]>, options?: HeatLayer.HeatLayerOptions);
    setLatLngs(latlngs: Array<[number, number, number]> | Array<L.LatLng> | Array<L.LatLng[]>): this;
    addLatLng(latlng: [number, number, number] | L.LatLng): this;
    setOptions(options: HeatLayer.HeatLayerOptions): this;
    redraw(): this;
  }
  
  function heatLayer(latlngs: Array<[number, number, number]> | Array<L.LatLng> | Array<L.LatLng[]>, options?: HeatLayer.HeatLayerOptions): HeatLayer;
}

declare module 'leaflet.heat' {
  export = L;
}