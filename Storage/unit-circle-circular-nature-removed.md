Removed from `trigonometry-unit-circle.html` on 2026-06-04.

Widget files:
- Cowboy orientation: `Storage/Cowboy-Orientation.html`
- Constrained movement: `Storage/Constrained-Movement.html`

Kept in chapter:
- Temperature line vs circular degrees image.

## The Circular Nature of Angles

Imagine looking down upon a cowboy living in a 2D world. You would see, of course, two concentric circles -- his hat.

All the possible directions he could face can be represented as a circle around him. We call the direction he faces at any point in time his 'orientation'.

Now, this is an indecisive cowboy. He begins facing east, then turns north, east, south, and finally back to east again.

Widget A. Cowboy orientation.

Notice this and think about it: **orientation in a 2D space is intrinsically circular**.

Take a different type of measure -- not a measure of angle, but a measure of temperature. If we move in one direction we would only ever get hotter or colder.

Image A: Two panels. 1. Show a number line of temperature measure with arrows pointing left and right. 2. Show a circle of degrees with a looping arrow around it.

However, if we move in one direction in terms of orientation, we will end up where we started. Just like the cowboy who only went left.

### Constrained Movement

The cowboy can only move along the circle.

He is on the left. The tavern is on the right.

In order to move rightwards, he must also move upwards (or downwards).

Let's impose an $xy$ grid to make things clearer.

Widget B. Similar to widget A. The cowboy is depicted on the left of the circle (-1,0) and a tavern or some related imagery on the right (1, 0). The user can move the cowboy across the circle to reach the tavern.

To move around a circle, we are never moving purely horizontally or purely vertically.

If one coordinate changes, the other must change in a way that preserves the circle: sometimes $x$ go up as $y$ goes down, or the inverse, or they both go up or down at the same time.

The point is that every movement is a combination of horizontal and vertical changes.

The proportions of those changes continually vary, but they are constrained so that the point remains on the circle.

This suggests something interesting.

While an angle appears to be a single quantity, its motion around a circle can be represented by two coupled quantities.

As one changes, the other must change in a way that preserves the circular structure.
