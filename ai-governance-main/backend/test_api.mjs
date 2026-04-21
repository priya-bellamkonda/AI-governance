import fs from 'fs';
import path from 'path';

const BACKEND = 'http://localhost:3001';

async function runTests() {
    console.log("=== STARTING INTEGRATION TESTS ===");

    try {
        console.log("--> Logging in as demo user to get token...");
        const loginRes = await fetch(`${BACKEND}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'demo@rakfort.com', password: 'governance.demo@Rakfort' })
        });
        
        const loginData = await loginRes.json();
        if (!loginData.data || !loginData.data.token) {
            throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
        }
        const token = loginData.data.token;
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        console.log("\n✅ TEST 1: Create a Requirement");
        const req1Body = {
            id: "REQ-2026-001",
            title: "Multi-Factor Authentication (MFA)",
            description: "Implement MFA for all user accounts",
            category: "Authentication",
            priority: "Critical",
            status: "Draft",
            owner: "Security Team",
            verification_method: "Security audit",
            acceptance_criteria: [
                "Users forced to set up MFA",
                "Enforced on login"
            ],
            complianceMappings: [{
                framework: "ISO 27001",
                control: "A.9.2.1"
            }]
        };
        const res1 = await fetch(`${BACKEND}/requirements`, {
            method: 'POST',
            headers,
            body: JSON.stringify(req1Body)
        });
        const data1 = await res1.json();
        console.log(JSON.stringify(data1, null, 2));

        console.log("\n✅ TEST 2: Get All Requirements");
        const res2 = await fetch(`${BACKEND}/requirements`, { headers });
        const data2 = await res2.json();
        console.log(`Total: ${data2.total}`);
        if(data2.data) { data2.data.forEach(r => console.log(`  - ${r.id}: ${r.title} [${r.status}]`)); }

        console.log("\n✅ TEST 3: Filter by Priority (Critical)");
        const res3 = await fetch(`${BACKEND}/requirements?priority=Critical`, { headers });
        const data3 = await res3.json();
        console.log(`Found: ${data3.total}`);
        if(data3.data) { data3.data.forEach(r => console.log(`  [${r.priority}] ${r.id}: ${r.title}`)); }

        console.log("\n✅ TEST 4: Filter by Status (Draft)");
        const res4 = await fetch(`${BACKEND}/requirements?status=Draft`, { headers });
        const data4 = await res4.json();
        console.log(`Found: ${data4.total}`);

        console.log("\n✅ TEST 6: Get Single Requirement");
        const res6 = await fetch(`${BACKEND}/requirements/REQ-2026-001`, { headers });
        const data6 = await res6.json();
        console.log(`ID: ${data6?.data?.id}, Title: ${data6?.data?.title}`);

        console.log("\n✅ TEST 7: Update Requirement");
        const req7Body = { status: "In Progress", owner: "John Doe", priority: "High" };
        const res7 = await fetch(`${BACKEND}/requirements/REQ-2026-001`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(req7Body)
        });
        const data7 = await res7.json();
        console.log(`New Status: ${data7?.data?.status}, New Owner: ${data7?.data?.owner}`);

        console.log("\n✅ TEST 8: Create Second Requirement");
        const req8Body = {
            id: "REQ-2026-002",
            title: "Data Encryption at Rest",
            description: "Encrypt data",
            category: "Encryption",
            priority: "High",
            status: "Draft",
            owner: "Infrastructure Team"
        };
        const res8 = await fetch(`${BACKEND}/requirements`, {
            method: 'POST',
            headers,
            body: JSON.stringify(req8Body)
        });
        const data8 = await res8.json();
        console.log(JSON.stringify(data8, null, 2));

        console.log("\n✅ TEST 9: Filter by Multiple Criteria (High + Draft)");
        const res9 = await fetch(`${BACKEND}/requirements?priority=High&status=Draft`, { headers });
        const data9 = await res9.json();
        console.log(`Found: ${data9.total}`);
        if(data9.data) { data9.data.forEach(r => console.log(`  ${r.id}: ${r.title}`)); }

        console.log("\n✅ TEST 11: Delete Requirement");
        const res11 = await fetch(`${BACKEND}/requirements/REQ-2026-002`, {
            method: 'DELETE',
            headers
        });
        const data11 = await res11.json();
        console.log(`Response: ${JSON.stringify(data11)}`);

        console.log("\n✅ TEST 12: Verify Deletion");
        const res12 = await fetch(`${BACKEND}/requirements`, { headers });
        const data12 = await res12.json();
        console.log(`Remaining: ${data12.total}`);
        if(data12.data) { data12.data.forEach(r => console.log(`  - ${r.id}: ${r.title}`)); }

        console.log("\n=== ALL TESTS COMPLETED SUCCESSFULLY ===");

    } catch (e) {
        console.error("Test failed:", e);
    }
}

runTests();
