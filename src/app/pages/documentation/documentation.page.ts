import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SwipeBackDirective } from '../../directives/swipe-back.directive';

@Component({
  selector: 'app-documentation',
  standalone: true,
  imports: [CommonModule, SwipeBackDirective],
  templateUrl: './documentation.page.html',
})
export class DocumentationPage implements OnInit {
  isFirstRun = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.isFirstRun = params['firstRun'] === 'true';
    });
  }

  goBack(): void {
    if (this.isFirstRun) {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/settings']);
    }
  }
}
