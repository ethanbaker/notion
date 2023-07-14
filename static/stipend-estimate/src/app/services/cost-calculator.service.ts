import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

/** The URL that leads to the cost of attendance page */
const COST_OF_ATTENDANCE_URL = `https://cors.ethanbaker.dev/https://studentservices.ncsu.edu/your-money/financial-aid/estimated-cost-of-attendance/undergraduate-student/`;

/** The URL that leads to the cost of health insurance */
const COST_OF_HEALTH_INSURANCE_URL = `https://cors.ethanbaker.dev/https://studentservices.ncsu.edu/2022/06/fall-2022-health-insurance-requirement/`;

/** HTTP options needed for the URL to be allowed */
const HTTP_OPTIONS: Object = {
  headers: new HttpHeaders({
    'Content-Type': 'text/html',
  }),
  responseType: "text",
};

/**
 * CostCalculatorService is used to go to the NC State Student
 * Services center, pull data from the estimated cost of attendance
 * page, and hold information on category expenses/totals.
 */
@Injectable({
  providedIn: 'root'
})
export class CostCalculatorService {
  /** Financial Aid Estimate Categories (Per Year) */
  public estimates: Map<string, number> = new Map<string, number>();

  /** Fixed Expenses Categories */
  public fixed: Map<string, number> = new Map<string, number>();

  /** Flexible Expenses Category */
  public flexible: Map<string, number> = new Map<string, number>();

  /** Optional Expenses Category */
  public optional: Map<string, number> = new Map<string, number>();

  /**
   * Pull the cost of attendance page and parse it to find category totals
   * 
   * @param httpClient HTTP Client to get the NC State cost of attendance page
   */
  constructor(private httpClient: HttpClient) {
    // Initialize the estimation categories
    this.estimates.set("Tuition & Fees", -1);
    this.estimates.set("Books & Supplies", -1);
    this.estimates.set("Housing", -1);
    this.estimates.set("Food", -1);
    this.estimates.set("Personal Expenses", -1);
    this.estimates.set("Transportation", -1);
    this.estimates.set("Loan Fees", -1);

    this.httpClient.get(COST_OF_ATTENDANCE_URL, HTTP_OPTIONS).subscribe(
      (res: Object): void => {
        let html = res.toString();

        // Splice the HTML to only get the table we care about
        html = html.substring(html.indexOf("<table"), html.indexOf("</table>"))
        html = html.replace(/<[\/a-z=" -]*>/g, "").replace(/&amp;/g, "&");

        // Find the dollar amount for each category
        for (let [key, _] of this.estimates) {
          this.estimates.set(key, this.parseHTMLForCategory(html, key));
        }

        // Initialize the fixed expenses categories
        this.fixed.set("Tuition & Fees", this.estimates.get("Tuition & Fees") || -1);
      }
    );

    // Initialize the optional expenses category
    this.optional.set("Engineering EYE Fee", 750);
    this.optional.set("Student Blue Health Insurance", -1);

    this.httpClient.get(COST_OF_HEALTH_INSURANCE_URL, HTTP_OPTIONS).subscribe(
      (res: Object): void => {
        const html = res.toString();

        // Splice the HTML to only get the value we care about
        this.optional.set("Student Blue Health Insurance", +html.substring(html.indexOf("$") + 1, html.indexOf(" ", html.indexOf("$") + 1)).replace(/,/g, ""));
      }
    );

    // Initialize the flexible expenses category
    this.flexible.set("Housing", 0);
    this.flexible.set("Meal Plan + Tax", 0);
    this.flexible.set("Textbook/Subscriptions", 0);
  }

  /**
   * Helper function to parse HTML data and return number output
   * 
   * @param html The HTML data to parse
   * @param title The title to search for
   */
  private parseHTMLForCategory(html: string, title: string): number {
    return +html.substring(html.indexOf(`${title}\n`), html.indexOf("\n", html.indexOf(`${title}\n`) + `${title}\n`.length + 1)).replace(/[^0-9]/g, "") / 2;
  }
}
