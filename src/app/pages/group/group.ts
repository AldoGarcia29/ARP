import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-group-page',
  standalone: true,
  imports: [CardModule, TagModule],
  templateUrl: './group.html',
  styleUrls: ['./group.scss'],
})
export class Group {
  total = 12; // número demo
}