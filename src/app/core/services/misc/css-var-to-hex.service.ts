import { Injectable } from "@angular/core";

@Injectable({ 'providedIn': 'root' })
export class CssVarToHexService {
    private cache: Map<string, string> = new Map();

    /**
     * Pass in the variable with this format `--my-css-var` (No parentheses)
     * @param varName 
     * @returns 
     */
    cssVarToHex(varName: string): string {
        const tryGet = this.cache.get(varName);

        if (tryGet)
            return tryGet;

        const tempElement = document.createElement("div");
        document.body.appendChild(tempElement);

        // Set the CSS variable as the background color of the element
        tempElement.style.backgroundColor = `var(${varName})`;

        // Get the computed color value (usually in rgb format)
        const computedColor = getComputedStyle(tempElement).backgroundColor;

        // Remove the temporary element from the document
        document.body.removeChild(tempElement);

        const rgbVal = this.rgbToHex(computedColor);
        this.cache.set(varName, rgbVal);
        return rgbVal;
    }

    private rgbToHex(rgb: string) {

        const rgbValues = rgb.match(/\d+/g)?.map(Number);

        if (!rgbValues) {
            console.log(`RGB conversion error: ${rgb}`)
            return "#fff";
        }

        // Convert each to hex and pad with zeros if necessary
        return `#${rgbValues
            .map((val) => val.toString(16).padStart(2, "0"))
            .join("")}`;
    }
}