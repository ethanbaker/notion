# Static Stock Widget

This static stock integration shows my stock purchases for a Notion embed. The widget
from [tradingview](https://www.tradingview.com/widget/market-overview)is encapsulated
and hosted at [stocks.notion.ethanbaker.dev](https://stocks.notion.ethanbaker.dev).

## Adding a Stock

Right now there are two different categories in the widget: `Vanguard`, and `eTrade`. 
These represent the different platforms I am investing in. In order to add a new stock,
follow the formatting below and add an object to the symbols array in each category.

```json
{
    "s": "LOCATION:SYMBOL",
    "d": "Description"
}
```

Examples already exist in the widget. In order to find the specific `LOCATION:SYMBOL` value,
you can check the [tradingview](https://www.tradingview.com/widget/market-overview/) site.

## Customizing the Graph

All other customization options exist as JSON in the widget file. All of these values are
descriptive to their function and can be changed accordingly, given that they follow the
associated format.