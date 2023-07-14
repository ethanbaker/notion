import { Component, Input } from '@angular/core';
import { CostCalculatorService } from './services/cost-calculator.service';
import { ThemePalette } from '@angular/material/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  /** The theme for the checkboxes */
  public CHECKBOX_COLOR: ThemePalette = "primary";

  /** Bindings to optional costs */
  public optionalExpenses: string[] = [];

  /**
   *  Constructor for the app, which initializes the cost calculator service 
   * @param costCalculatorService 
   */
  constructor(public costCalculatorService: CostCalculatorService) {}

  /**
   * Update a flexible amount
   * 
   * @param key The key to update
   * @param event The event on the input element
   */
  public updateFlexible(key: string, event: any) {
    this.costCalculatorService.flexible.set(key, +event.target.value.replace(/[^0-9]/g, ""));
  }

  /**
   * Unfocus an input element when enter is clicked
   * 
   * @param event The event used to unfocus the element
   */
  public unfocus(event: any) {
    event.target.blur();
  }

  /**
   * Get the sum of estimates
   * 
   * @return The sum of estimate categories
   */
  public estimateSum(): number {
    let sum: number = 0;

    for (let [_, value] of this.costCalculatorService.estimates) {
      sum += value;
    }

    return sum;
  }

  /**
   * Get the sum of optional expenses
   * 
   * @return The sum of selected optional expenses
   */
  public optionalSum(): number {
    let sum: number = 0;

    for (let key of this.optionalExpenses) {
      sum += this.costCalculatorService.optional.get(key) || 0;
    }

    return sum;
  }

  /**
   * Get the sum of fixed expenses
   * 
   * @return The sum of fixed expenses
   */
  public fixedSum(): number {
    let sum: number = 0;

    for (let [_, value] of this.costCalculatorService.fixed) {
      sum += value;
    }

    return sum;
  }

  /**
   * Get the sum of flexible expenses
   * 
   * @return The sum of flexible expenses
   */
  public flexibleSum(): number {
    let sum: number = 0;

    for (let [_, value] of this.costCalculatorService.flexible) {
      sum += value;
    }

    return sum;
  }

  /**
   * Return the total amount of estimated expenses
   * 
   * @return The total amount of estimated expenses
   */
  public expenses(): number {
    return this.fixedSum() + this.flexibleSum() + this.optionalSum();
  }

  /**
   * Return the estimated stipend refund
   * 
   * @return The estimated stipend refund
   */
  public refund(): number {
    return this.estimateSum() - this.expenses();
  }
}
