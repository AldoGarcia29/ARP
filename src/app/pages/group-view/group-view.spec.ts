import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupView } from './group-view';

describe('GroupView', () => {
  let component: GroupView;
  let fixture: ComponentFixture<GroupView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
