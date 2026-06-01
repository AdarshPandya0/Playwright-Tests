import { test, expect } from "../utils/fixtures.js";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Add this line to ignore TLS errors for self-signed certificates

test('Create Patient via API and verify in UI', async ({ page, patientPage }) => {
    
    // ==========================================
    // PHASE 1: ARRANGE (Generate Unique Data)
    // ==========================================
    // Generate a unique 6-digit string using the current time
    const uniqueStamp = Date.now().toString().slice(-6); 
    const uniqueFirstName = `Adam${uniqueStamp}`;
    const uniqueUID = `99900${uniqueStamp.slice(-4)}`; // Keeps the 9-digit format
    
    // Extract the authorization token from the browser's local storage (adjust the key if needed!)
    // If your app stores it in a cookie instead, you might not even need this header.
    const allCookies = await page.context().cookies();
    const xTokenCookie = allCookies.find(c => c.name === 'x-token');
    
    // If the token isn't found, stop the test immediately and warn us!
    expect(xTokenCookie, 'CRITICAL: Could not find live x-token in browser cookies!').toBeDefined();
    
    const liveAuthToken = xTokenCookie.value;
    const patientPayload = {"id":null,"isActive":true,"chartNumber":null,"facilityId":1000614,"providerId":null,"prefix":null,"firstName": uniqueFirstName,"lastName":"Jones","lastName2":null,"middleName":null,"suffix":null,"uID":uniqueUID,"dOB":315532800000,"isMultipleBirth":false,"multipleBirthOrder":null,"sexId":10006814,"genderIdentityId":null,"sexualOrientationId":null,"maritalStatusId":null,"aka":null,"preferredLanguageId":null,"isInterpreter":false,"driverLicense":null,"primaryPharmacyId":null,"isUseCurrentPharmacyForAllRx":false,"referralSourceId":null,"deceasedDate":null,"deceasedTime":null,"note":null,"photoId":null,"isSelfPay":true,"isGenerateFinanceCharge":true,"isVerified":false,"firstCalledDate":null,"isInsured":false,"lastModifiedDate":null,"contactDetail":{"created":[{"id":null,"createdById":null,"createdDate":null,"isPrimary":true,"lastModifiedById":null,"lastModifiedDate":null,"resourceId":null,"resourceType":null,"addressType":{"text":"Home","createdBy":null,"lastModifiedBy":null,"clientId":10006,"id":1000616,"code":"Home","name":null,"count":0,"isActive":null,"statusColor":null,"color":null,"sequence":null,"fromVendor":null,"isCustom":null,"valueTypeId":null,"min":null,"max":null,"type":"AddressType","typeId":null,"jobTitle":null,"duration":null,"isSelect":null,"toTime":null,"fromTime":null,"description":"Home","isPrimary":null,"extCode":null,"clientUserId":null,"codeTypeId":null,"codeTypeCode":null,"lastModifiedDate":1631959098638,"isSelectable":true},"addressTypeId":1000616,"prefComm":null,"contactAddress":{"id":null,"feId":null,"text":null,"city":"GAINESVILLE","contactDetailId":null,"countryCode":"US","countryId":1000650,"createdById":null,"createdDate":null,"lastModifiedById":null,"lastModifiedDate":null,"stateObj":null,"state":"FLORIDA","stateCode":"FL","street":"Grove Street, GAINSEVILLE","street2":null,"zipCode":"326010000","createdBy":null,"lastModifiedBy":null,"country":{"text":"(US) United States","createdBy":null,"lastModifiedBy":null,"clientId":10006,"id":1000650,"code":"US","name":"United States","count":null,"isActive":true,"statusColor":null,"color":null,"sequence":null,"fromVendor":null,"isCustom":null,"valueTypeId":null,"min":null,"max":null,"type":null,"typeId":null,"jobTitle":null,"duration":null,"isSelect":null,"toTime":null,"fromTime":null,"description":null,"isPrimary":null,"extCode":null,"clientUserId":null,"codeTypeId":null,"codeTypeCode":null,"numericCode":"1","countryWithCode":"+1 United States"},"contactAddressFEId":3},"contactFax":[],"contactPhone":[],"contactEmail":[],"contactWebsite":[]},{"id":null,"createdById":null,"createdDate":null,"isPrimary":false,"lastModifiedById":null,"lastModifiedDate":null,"resourceId":null,"resourceType":null,"addressType":{"text":"Work","createdBy":null,"lastModifiedBy":null,"clientId":10006,"id":1000623,"code":"Work","name":null,"count":0,"isActive":null,"statusColor":null,"color":null,"sequence":null,"fromVendor":null,"isCustom":null,"valueTypeId":null,"min":null,"max":null,"type":"AddressType","typeId":null,"jobTitle":null,"duration":null,"isSelect":null,"toTime":null,"fromTime":null,"description":"Work","isPrimary":null,"extCode":null,"clientUserId":null,"codeTypeId":null,"codeTypeCode":null,"lastModifiedDate":1631959098638,"isSelectable":true},"addressTypeId":1000623,"prefComm":null,"contactAddress":{"id":null,"feId":null,"text":null,"city":null,"contactDetailId":null,"countryCode":"US","countryId":1000650,"createdById":null,"createdDate":null,"lastModifiedById":null,"lastModifiedDate":null,"stateObj":null,"state":null,"stateCode":null,"street":null,"street2":null,"zipCode":null,"createdBy":null,"lastModifiedBy":null,"country":{"text":"+1 United States","createdBy":null,"lastModifiedBy":null,"clientId":10006,"id":1000650,"code":"US","name":"United States","count":null,"isActive":true,"statusColor":null,"color":null,"sequence":null,"fromVendor":null,"isCustom":null,"valueTypeId":null,"min":null,"max":null,"type":null,"typeId":null,"jobTitle":null,"duration":null,"isSelect":null,"toTime":null,"fromTime":null,"description":null,"isPrimary":null,"extCode":null,"clientUserId":null,"codeTypeId":null,"codeTypeCode":null,"numericCode":"1","countryWithCode":"+1 United States"},"contactAddressFEId":4},"contactFax":[],"contactPhone":[],"contactEmail":[],"contactWebsite":[]}],"updated":[],"deleted":[]},"race":null,"ethnicity":[],"sOFDate":null,"isCreateCase":false,"birthPlace":null,"isDeceased":false,"mothersIdentifier":null,"mothersMaidenFirstName":null,"mothersMaidenLastName":null,"mothersMaidenMiddleName":null,"religionId":null,"veteransMilitaryStatusId":null,"citizenshipId":null,"nationality":null,"isPCPSameAsProvider":false,"pCPId":null,"pCPTypeId":null,"employmentId":null,"primaryLabId":null,"patientPharmacyList":null,"patientDLList":null,"primaryPharmacy":null,"timeZoneId":10006268,"appointmentId":null,"contactDetailPreference":[{"id":null,"resourceId":null,"resourceTypeId":null,"prefCommTypeId":null,"prefCommValueId":null,"prefCommValueFEId":null,"preferenceTypeId":10006443,"contactAddressId":null,"contactPhoneId":null,"contactFaxId":null,"contactEmailId":null,"lastModifiedDate":null,"contactAddressFEId":3,"contactPhoneFEId":null,"contactFaxFEId":null,"contactEmailFEId":null,"contactWebsiteId":null,"contactWebsiteFEId":null},{"id":null,"resourceId":null,"resourceTypeId":null,"prefCommTypeId":null,"prefCommValueId":null,"prefCommValueFEId":null,"preferenceTypeId":10006448,"contactAddressId":null,"contactPhoneId":null,"contactFaxId":null,"contactEmailId":null,"lastModifiedDate":null,"contactAddressFEId":3,"contactPhoneFEId":null,"contactFaxFEId":null,"contactEmailFEId":null,"contactWebsiteId":null,"contactWebsiteFEId":null},{"id":null,"resourceId":null,"resourceTypeId":null,"prefCommTypeId":null,"prefCommValueId":null,"prefCommValueFEId":null,"preferenceTypeId":10006450,"contactAddressId":null,"contactPhoneId":null,"contactFaxId":null,"contactEmailId":null,"lastModifiedDate":null,"contactAddressFEId":3,"contactPhoneFEId":null,"contactFaxFEId":null,"contactEmailFEId":null,"contactWebsiteId":null,"contactWebsiteFEId":null},{"id":null,"resourceId":null,"resourceTypeId":null,"prefCommTypeId":null,"prefCommValueId":null,"prefCommValueFEId":null,"preferenceTypeId":10006454,"contactAddressId":null,"contactPhoneId":null,"contactFaxId":null,"contactEmailId":null,"lastModifiedDate":null,"contactAddressFEId":3,"contactPhoneFEId":null,"contactFaxFEId":null,"contactEmailFEId":null,"contactWebsiteId":null,"contactWebsiteFEId":null},{"id":null,"resourceId":null,"resourceTypeId":null,"prefCommTypeId":null,"prefCommValueId":null,"prefCommValueFEId":null,"preferenceTypeId":10006449,"contactAddressId":null,"contactPhoneId":null,"contactFaxId":null,"contactEmailId":null,"lastModifiedDate":null,"contactAddressFEId":null,"contactPhoneFEId":null,"contactFaxFEId":null,"contactEmailFEId":null,"contactWebsiteId":null,"contactWebsiteFEId":null}],"primaryLabName":null,"primaryLabCode":null,"patientRisk":{"created":[],"updated":[],"deleted":[]},"tags":null,"customStatusId":null,"patientLabPreferenceMap":{"created":[],"updated":[],"deleted":[]},"initialPatientLabPreferenceMap":null,"sourceId":null,"sourceTypeId":null,"extGuid":null,"extId":null,"extUpdateDate":null,"lastPatientStatementId":null,"feeScheduleDetailId":null,"extRefId":null,"isProspect":false,"extMessageGuid":null,"currentResidenceId":null,"relationId":null,"evacuationStatusId":null,"codeStatusId":null,"advanceDirectiveId":null,"diet":[],"isPatientStatementConsent":true,"isSOF":true,"copyDetail":null,"serviceLocationId":null,"serviceLocationTypeId":null,"mrnNo":null,"hmisNo":null};


    // ==========================================
 // PHASE 2: ACT (Fire the API Request)
    const response = await page.request.post('/api/patient', {
        headers: {
            'accept': 'application/json, text/plain, */*',
            'content-type': 'application/json',
            
            // 1. Add the security origin headers
            'origin': process.env.URL,
            'referer': `${process.env.URL}`,
            
            // 2. Add the custom routing header exactly as Postman has it
            'x-requestargs': 'iemoweb;0.0.1;PATIENTDEMOGRAPHICS;718ec9e7-4415-4b4d-ba54-49a66b2d09a9;/app/patient/create',
            
            'x-token': liveAuthToken
        },
        data: patientPayload
    });

    // Let's console log the response body if it fails so we can see the exact error the server throws
    if (response.status() !== 200) {
        console.log(await response.text());
    }

    expect(response.status()).toBe(200);

    // ==========================================
    // PHASE 3: ASSERT (Verify in the UI)
    // ==========================================
    await patientPage.goto();
    
    // Search for the exact dynamic name we just created
    await patientPage.searchForPatient(uniqueFirstName);
    
    // Verify the grid loads the new patient
    const firstResult = page.locator('.mtab-primary-panel').first();

    await expect( async () => {
        await expect(firstResult).toContainText(uniqueFirstName, {
            timeout: 500, // Adjust timeout as needed for your app's response time
        });
    }).toPass();
});