import {  expect, test } from '../utils/fixtures.js';

test('Verify Error Propmt @patient @regression ',  async({ page, patientPage }) => {

    await patientPage.goto();

    await page.route('**/api/patient/fetch?page=1&size=20&orderBy=name&search=&title=&isSorted=true', async (route) => {

        await route.fulfill({
            status : 200,
            contentType : 'application/json',
            body : JSON.stringify({
                                    "status": "fail",
                                    "data": {
                                        "messages": [
                                            {
                                                "description": "An error occurred. Please contact support.",
                                                "error": "SnippetAfterError:1,\u0022providerId\u0022:100053557,\u0022rxId\u0022:100054587562}],\u0022deObject reference not set to an instance of an object.",
                                                "code": "BackendError"
                                            }
                                        ]
                                    },
                                    "message": "Drug.PostCheck\n--------------------------------Object reference not set to an instance of an object.\n   at BusinessService.DrugCheckService.DrugCheck(DrugCheckBOList objRequest) in C:\\Working\\EHRAPI\\EHRAPICORE\\EHRAPI\\BusinessService\\DrugCheckService.cs:line 104\n   at EHRAPI.Controllers.DrugController.PostCheck(DrugCheckBOList objRequest) in C:\\Working\\EHRAPI\\EHRAPICORE\\EHRAPI\\EHRAPI\\Controllers\\DrugController.cs:line 292\n   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)\n   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.\u003CInvokeActionMethodAsync\u003Eg__Awaited|12_0(ControllerActionInvoker invoker, ValueTask\u00601 actionResultValueTask)\n   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.\u003CInvokeNextActionFilterAsync\u003Eg__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)\n   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)\n   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State\u0026 next, Scope\u0026 scope, Object\u0026 state, Boolean\u0026 isCompleted)\n   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()\n--- End of stack trace from previous location ---\n   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.\u003CInvokeNextExceptionFilterAsync\u003Eg__Awaited|26_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)"
                                })
        });
    })

    await patientPage.orderByPatientColumnBtn.click();

    const errorMessage = page.getByText('An error occurred. Please contact support.');

    await expect(errorMessage).toBeVisible();


});