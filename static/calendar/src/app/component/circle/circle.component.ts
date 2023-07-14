import { Component, Input } from '@angular/core';

/**
 * Circle component represents a circle dot with a given color
 * and fixed radius
 */
@Component({
  selector: 'circle',
  templateUrl: './circle.component.html',
  styleUrls: ['./circle.component.scss']
})
export class CircleComponent { 
  /** The color of the circle */
  @Input("color")
  public color: string = "";

  /** The radius of the circle */
  public radius: string = "20px";
}
