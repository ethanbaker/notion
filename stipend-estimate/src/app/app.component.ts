import { Component } from '@angular/core';
import { CostCalculatorService } from './services/cost-calculator.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(public costCalculatorService: CostCalculatorService) {

  }
}
