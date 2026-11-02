export declare enum OverlayAnchor {
    Top = "top",
    Middle = "middle",
    Bottom = "bottom",
    Start = "start",
    Center = "center",
    End = "end"
}
export type Overlay<TComponent> = {
    anchors: [OverlayAnchor, ...OverlayAnchor[]];
    component: TComponent;
};
