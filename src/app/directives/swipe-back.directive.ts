import { Directive, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Directive({
  selector: '[appSwipeBack]',
  standalone: true
})
export class SwipeBackDirective implements OnInit, OnDestroy {
  private startX: number = 0;
  private startY: number = 0;
  private startTime: number = 0;
  private isEnabled: boolean = true;
  
  // Thresholds for swipe gesture
  private readonly SWIPE_MIN_DISTANCE = 50; // Minimum horizontal distance in pixels
  private readonly SWIPE_MAX_TIME = 500; // Maximum time for swipe in ms
  private readonly SWIPE_MAX_VERTICAL = 100; // Maximum vertical movement
  private readonly EDGE_START_ZONE = 50; // Start from left edge zone (pixels)

  constructor(
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    // Disable on home page
    this.checkRoute();
    this.router.events.subscribe(() => {
      this.checkRoute();
    });
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  private checkRoute() {
    // Disable on home page
    const currentUrl = this.router.url;
    this.isEnabled = currentUrl !== '/' && currentUrl !== '';
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    if (!this.isEnabled) return;
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();

    // Only start tracking if touch starts near left edge
    if (this.startX > this.EDGE_START_ZONE) {
      this.startX = 0; // Reset to ignore this touch
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    if (!this.isEnabled) return;
    if (this.startX === 0) return; // Not tracking this touch
    if (event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    const deltaX = endX - this.startX;
    const deltaY = Math.abs(endY - this.startY);
    const deltaTime = endTime - this.startTime;

    // Check if it's a valid swipe right gesture
    const isSwipeRight = 
      deltaX > this.SWIPE_MIN_DISTANCE && // Moved right enough
      deltaY < this.SWIPE_MAX_VERTICAL && // Not too much vertical movement
      deltaTime < this.SWIPE_MAX_TIME; // Fast enough

    if (isSwipeRight) {
      event.preventDefault();
      this.goBack();
    }

    // Reset tracking
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
  }

  @HostListener('touchcancel', ['$event'])
  onTouchCancel(event: TouchEvent) {
    // Reset tracking on cancel
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
  }

  private goBack() {
    // Use browser back navigation
    this.location.back();
  }
}
