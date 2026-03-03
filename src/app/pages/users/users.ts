import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CardModule, DividerModule],
  templateUrl: './users.html',
  styleUrls: ['./users.scss'],
})
export class Users {
  profile = {
    username: '__________',
    email: '__________',
    fullName: '__________',
    address: '__________',
    phone: '__________',
    birthDate: '__________',
  };
}