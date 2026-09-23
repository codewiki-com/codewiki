import { revealCircle } from '../../src/lib/theme-transition';

describe('revealCircle', () => {
  it('places the centre as a percentage of the box', () => {
    const circle = revealCircle(1217, 28, 1280, 800);
    expect(circle.x).toBeCloseTo((1217 / 1280) * 100, 6);
    expect(circle.y).toBeCloseTo((28 / 800) * 100, 6);
  });

  it('sizes the radius to reach the farthest corner', () => {
    const [width, height] = [1280, 800];
    const circle = revealCircle(1217, 28, width, height);
    const px = (circle.r / 100) * (Math.hypot(width, height) / Math.SQRT2);
    expect(px).toBeCloseTo(Math.hypot(1217, 800 - 28), 6);
  });

  it('is independent of the pixel unit the box is measured in', () => {
    const css = revealCircle(600, 20, 1200, 800);
    const device = revealCircle(1200, 40, 2400, 1600);
    expect(device.x).toBeCloseTo(css.x, 9);
    expect(device.y).toBeCloseTo(css.y, 9);
    expect(device.r).toBeCloseTo(css.r, 9);
  });
});
