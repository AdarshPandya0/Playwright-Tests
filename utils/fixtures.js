import { test as base } from "@playwright/test";
import { PatientListPage } from "../pages/PatientListPage";
import { DocumentCenterPage } from "../pages/DocumentCenterPage";

export const test = base.extend({ 

    patientPage: async({ page }, use) => {
        const patientPage = new PatientListPage(page);
        await use(patientPage);
    },

    docCenter : async({ page }, use) => {
        const docCenter = new DocumentCenterPage(page);
        await use(docCenter);
    }
});

export { expect } from "@playwright/test";