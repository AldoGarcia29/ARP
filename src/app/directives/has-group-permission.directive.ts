import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import { PermissionService } from '../services/permission.service';

interface GroupPermissionConfig {
  permission: string;
  groupId: string;
}

@Directive({
  selector: '[appHasGroupPermission]',
  standalone: true
})
export class HasGroupPermissionDirective {
  private config: GroupPermissionConfig | null = null;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}

  @Input()
  set appHasGroupPermission(config: GroupPermissionConfig) {
    this.config = config;
    this.updateView();
  }

  private updateView(): void {
    this.viewContainer.clear();

    if (
      this.config?.permission &&
      this.config?.groupId &&
      this.permissionService.hasPermissionForGroup(
        this.config.permission,
        this.config.groupId
      )
    ) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}