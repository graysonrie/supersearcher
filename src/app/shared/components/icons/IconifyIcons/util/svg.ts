export function replaceColorWithGradient(svgString: string, hex1:string, hex2:string): string {
    // Parse the SVG string into a DOM object
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    
    // Ensure we have a valid SVG document
    const svgElement = doc.querySelector("svg");
    if (!svgElement) {
        throw new Error("Invalid SVG string");
    }

    // Create or get the <defs> element
    let defs = svgElement.querySelector("defs");
    if (!defs) {
        defs = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
        svgElement.insertBefore(defs, svgElement.firstChild);
    }

    // Create a <linearGradient> element
    const gradientId = "gradient";
    const linearGradient = doc.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    linearGradient.setAttribute("id", gradientId);
    linearGradient.setAttribute("x1", "0%");
    linearGradient.setAttribute("y1", "0%");
    linearGradient.setAttribute("x2", "100%");
    linearGradient.setAttribute("y2", "0%");

    // Add color stops to the gradient
    const stop1 = doc.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", hex1);
    linearGradient.appendChild(stop1);

    const stop2 = doc.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", hex2); 
    linearGradient.appendChild(stop2);

    // Append the gradient to <defs>
    defs.appendChild(linearGradient);

    // Replace all `fill` attributes with the gradient reference
    const elementsWithFill = svgElement.querySelectorAll("[fill]");
    elementsWithFill.forEach((element) => {
        element.setAttribute("fill", `url(#${gradientId})`);
    });

    // Serialize the modified SVG back to a string
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
}