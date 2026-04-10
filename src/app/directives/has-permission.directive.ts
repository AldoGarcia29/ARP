import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import { PermissionService } from '../services/permission.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private currentPermission: string | null = null;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}

  @Input()
  set appHasPermission(permission: string) {
    this.currentPermission = permission;
    this.updateView();
  }

  private updateView(): void {
    this.viewContainer.clear();

    if (
      this.currentPermission &&
      this.permissionService.hasPermission(this.currentPermission)
    ) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}