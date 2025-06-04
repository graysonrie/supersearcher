import { ElementRef } from "@angular/core";

/**
 * You'll need to call `cdr.detectChanges();` right before calling this function in order for it to work.
 *
 * Returns a list of all of the projected elements that couldn't get included since they were overflowing.
 * @param projectedElements The same array that your `ngFor` directive uses to project the elements
 * @param containerElement
 * @param innerElementsCssClass  A CSS class that all of the inner elements share, such as `.item` or `.thing`
 */
export function checkOverflow<T>(
  projectedElements: T[],
  containerElement: ElementRef,
  innerElementsCssClass: string,
  leftToRight: boolean = true,
  padding:number = 1
): T[] {
  const containerWidth = containerElement.nativeElement.offsetWidth;
  const innerElements = Array.from(
    containerElement.nativeElement.querySelectorAll(innerElementsCssClass)
  ) as HTMLElement[];
  const elementWidths = innerElements.map(
    (element) => element.offsetWidth * padding
  );
  const totalWidth = elementWidths.reduce((sum, width) => sum + width, 0);

  let currentWidth = totalWidth;
  let overflowingElements: T[] = [];

  while (currentWidth > containerWidth && projectedElements.length > 1) {
    if(leftToRight){
        currentWidth -= elementWidths.shift()!;
        overflowingElements.push(projectedElements.shift()!);
    }else{
        currentWidth -= elementWidths.pop()!;
        overflowingElements.push(projectedElements.pop()!);
    }
  }
  return overflowingElements;
}
