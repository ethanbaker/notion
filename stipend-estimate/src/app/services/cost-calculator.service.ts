import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

/** The URL that leads to the cost of attendance page */
const COST_OF_ATTENDANCE_URL = `https://cors-anywhere.herokuapp.com/https://studentservices.ncsu.edu/your-money/financial-aid/estimated-cost-of-attendance/undergraduate-student/`;

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
  public estimateCategories: Map<string, number> = new Map<string, number>();

  /**
   * Pull the cost of attendance page and parse it to find category totals
   * 
   * @param httpClient HTTP Client to get the NC State cost of attendance page
   */
  constructor(private httpClient: HttpClient) {
    // Initialize the estimation categories
    this.estimateCategories.set("Tuition & Fees", -1);
    this.estimateCategories.set("Books & Supplies", -1);
    this.estimateCategories.set("Housing", -1);
    this.estimateCategories.set("Food", -1);
    this.estimateCategories.set("Personal Expenses", -1);
    this.estimateCategories.set("Transportation", -1);
    this.estimateCategories.set("Loan Fees", -1);
  }

  ngInit() {
    this.httpClient.get(COST_OF_ATTENDANCE_URL, HTTP_OPTIONS).subscribe(
      (res: Object): void => {
        let html = res.toString();

        // Splice the HTML to only get the table we care about
        html = html.substring(html.indexOf("<table"), html.indexOf("</table>"))
        html = html.replace(/<[\/a-z=" -]*>/g, "").replace(/&amp;/g, "&");

        // Find the dollar amount for each category
        for (let [key, _] of this.estimateCategories) {
          this.estimateCategories.set(key, this.parseHTMLForCategory(html, key));
        }
      }
    );
  }

  /**
   * Helper function to parse HTML data and return number output
   * 
   * @param html The HTML data to parse
   * @param title The title to search for
   */
  private parseHTMLForCategory(html: string, title: string): number {
    return +html.substring(html.indexOf(`${title}\n`), html.indexOf("\n", html.indexOf(`${title}\n`) + `${title}\n`.length + 1)).replace(/[^0-9]/g, "");
  }
}
