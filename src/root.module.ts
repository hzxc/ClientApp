import { AbpModule, ABP_HTTP_PROVIDER } from '@abp/abp.module';
import { Injector } from '@angular/core';
import { AppAuthService } from '@app/shared/common/auth/app-auth.service';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { AppPreBootstrap } from './AppPreBootstrap';


export function appInitializerFactory(injector: Injector) {
    return () => {
        abp.ui.setBusy();

        handleLogoutRequest(injector.get(AppAuthService));

        return new Promise<boolean>((resolve, reject) => {
            AppPreBootstrap.run(() => {
                var appSessionService: AppSessionService = injector.get(AppSessionService);
                appSessionService.init().then(
                    (result) => {

                        //Css classes based on the layout
                        if (abp.session.userId) {
                            $('body').attr('class', 'page-md page-header-fixed page-sidebar-closed-hide-logo');
                        } else {
                            $('body').attr('class', 'page-md login');
                        }

                        //tenant specific custom css
                        if (appSessionService.tenant && appSessionService.tenant.customCssId) {
                            $('head').append('<link id="TenantCustomCss" href="' + AppConsts.remoteServiceBaseUrl + '/TenantCustomization/GetCustomCss?id=' + appSessionService.tenant.customCssId + '" rel="stylesheet"/>');
                        }

                        abp.ui.clearBusy();
                        resolve(result);
                    },
                    (err) => {
                        abp.ui.clearBusy();
                        reject(err);
                    }
                );
            });
        });
    }
}

function handleLogoutRequest(authService: AppAuthService) {
    var currentUrl = UrlHelper.initialUrl;
    var returnUrl = UrlHelper.getReturnUrl();
    if (currentUrl.indexOf(('account/logout')) >= 0 && returnUrl) {
        authService.logout(true, returnUrl);
    }
}