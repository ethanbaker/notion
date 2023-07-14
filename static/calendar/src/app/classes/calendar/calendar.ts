/**
 * Calendar class represents a calendar added to the application.
 */
export class Calendar {
  /** The name/URL of the calendar */
  private _url: string = "";

  /** The color of the calendar */
  private _color: string = "";

  /**
   * Constructor of a calendar, which takes a URL and color input
   * 
   * @param url The URL of the calendar to save
   * @param color The color of the calendar to save
   */
  constructor(url: string, color: string) {
    try {
      this._url = url;
      this._color = color;
    } catch (err: any) {
      throw err;
    }
  }

  /**
   * Set the name/URL of the calendar to a given hex string
   * 
   * @param url The URL of the calendar to set to
   * @throws InvalidArgumentException if the URL is invalid
   */
  set url(url: string) {
    if (url == undefined) {
      throw "InvalidArgumentException";
    }
    
    this._url = url;
  }

  /**
   * Set the color of the calendar
   * 
   * @param color The hex color to set to
   * @throws InvalidArgumentException if the color is invalid
   */
  set color(color: string) {
    if (color == undefined || color.length < 6) {
      throw "InvalidArgumentException";
    }

    this._color = color;
  }

  /**
   * Get the URL of the calendar
   * 
   * @return The URL of the calendar
   */
  get url(): string {
    return this._url;
  }

  /**
   * Get the color of the calendar
   * 
   * @return The color of the calendar
   */
  get color(): string {
    return this._color;
  }

}
