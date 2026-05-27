import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NbButtonModule, NbCardModule, NbIconModule } from '@nebular/theme';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule, NbCardModule, NbButtonModule, NbIconModule, TranslateModule],
  templateUrl: './error.page.html',
  styleUrls: ['./error.page.scss'],
})
export class ErrorPage implements OnInit {
  code = '';
  correlationId = '';
  i18nKey = 'ERR.GENERIC.INTERNAL';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.code = params.get('code') ?? 'ERR_INTERNAL';
    this.correlationId = params.get('correlationId') ?? '';
    this.i18nKey = this.code.startsWith('ERR_')
      ? 'ERR.' + this.code.substring(4).replace(/_/g, '.')
      : 'ERR.GENERIC.INTERNAL';
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  goBack(): void {
    this.location.back();
  }
}
