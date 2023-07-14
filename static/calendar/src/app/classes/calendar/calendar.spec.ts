import { Calendar } from './calendar';

describe("Calendar", () => {
  it("should create", () => {
    expect(new Calendar("url", "#ffffff")).toBeTruthy();
  });

  it("getters should work", () => {
    let calendar: Calendar = new Calendar("url", "#ffffff");
    expect(calendar).toBeTruthy();

    expect(calendar.url).toBe("url");
    expect(calendar.color).toBe("#ffffff");
  });

  it("setters should work", () => {
    let calendar: Calendar = new Calendar("url", "#ffffff");
    expect(calendar).toBeTruthy();

    expect(calendar.url).toBe("url");
    expect(calendar.color).toBe("#ffffff");

    calendar.url = "different url";
    calendar.color = "#000000";

    expect(calendar.url).toBe("different url");
    expect(calendar.color).toBe("#000000");
  })
});
