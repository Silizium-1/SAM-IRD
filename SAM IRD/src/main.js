import {
    Cartesian3,
    Math as CesiumMath,
    Terrain,
    Viewer,
    Cesium3DTileset,
    Cesium3DTileStyle,
    SplitDirection,
    createOsmBuildingsAsync,
    Ion,
} from "cesium";
import "./style.css";

Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;

const viewer = new Viewer("cesiumContainer", {
    terrain: Terrain.fromWorldTerrain(),
});

const heightStyle = new Cesium3DTileStyle({
    color: {
        conditions: [
            ["${Height} >= 25", "color('red')"],
            ["${Height} >= 15", "color('orange')"],
            ["${Height} >= 10", "color('yellow')"],
            ["true", "color('white', 0.8)"]
        ]
    }
});

let isStyleActive = false;
let isSplitActive = false;

async function loadMyBuildings() {
    try {
        const assetId = 4946967; 
        const tileset = await Cesium3DTileset.fromIonAssetId(assetId);
        viewer.scene.primitives.add(tileset);

        const osmBuildings = await createOsmBuildingsAsync();
        viewer.scene.primitives.add(osmBuildings);
        
        await viewer.zoomTo(tileset);

        tileset.splitDirection = SplitDirection.NONE;
        osmBuildings.splitDirection = SplitDirection.NONE;
        osmBuildings.show = false;

        const styleBtn = document.getElementById("toggleStyleBtn");
        const legend = document.getElementById("heightLegend");
        
        styleBtn.addEventListener("click", () => {
            isStyleActive = !isStyleActive;
            if (isStyleActive) {
                tileset.style = heightStyle; 
                styleBtn.textContent = "Standardfarbe anzeigen";
                legend.style.display = "block";
            } else {
                tileset.style = undefined; 
                styleBtn.textContent = "Höhenfarbe umschalten";
                legend.style.display = "none";
            }
        });

        // --- SPLIT-BUTTON ---
        const splitBtn = document.getElementById("toggleSplitBtn");
        // HIER WIRD DER SLIDER EINZIGES MAL DEFINIERT:
        const slider = document.getElementById("slider");

        splitBtn.addEventListener("click", () => {
            isSplitActive = !isSplitActive;

            if (isSplitActive) {
                tileset.splitDirection = SplitDirection.LEFT;
                osmBuildings.splitDirection = SplitDirection.RIGHT;
                osmBuildings.show = true; 
                slider.style.display = "block"; 
                splitBtn.textContent = "Split-Ansicht beenden";
            } else {
                tileset.splitDirection = SplitDirection.NONE;
                osmBuildings.show = false; 
                slider.style.display = "none"; 
                splitBtn.textContent = "Split-Ansicht aktivieren";
            }
        });

        // --- SLIDER BEWEGUNGS-LOGIK ---
        viewer.scene.splitPosition = 0.5; 
        let sliderActive = false;

        slider.addEventListener("pointerdown", (e) => {
            sliderActive = true;
            slider.setPointerCapture(e.pointerId);
        });

        slider.addEventListener("pointerup", (e) => {
            sliderActive = false;
            slider.releasePointerCapture(e.pointerId);
        });

        slider.addEventListener("pointermove", (e) => {
            if (!sliderActive) return;
            e.preventDefault();
            
            // Breite berechnen und Position updaten
            const width = viewer.canvas.clientWidth;
            let x = Math.max(0, Math.min(e.clientX, width));
            const splitPosition = x / width;
            
            viewer.scene.splitPosition = splitPosition;
            slider.style.left = `${splitPosition * 100}%`;
        });

    } catch (error) {
        console.error("Fehler beim Laden oder Steuern der Gebäude:", error);
    }
}

loadMyBuildings();