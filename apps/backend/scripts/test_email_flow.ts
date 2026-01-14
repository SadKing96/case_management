
const API_URL = 'http://localhost:3001/api/v1';

async function main() {
    try {
        console.log('1. Creating a new Case...');

        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
        };

        const boardsRes = await fetch(`${API_URL}/boards/mine`, { headers: authHeaders });
        if (!boardsRes.ok) throw new Error(`Failed to fetch boards: ${boardsRes.statusText}`);
        const boards = await boardsRes.json();
        const board = boards[0];
        if (!board) throw new Error('No boards found. Run seed.');

        console.log(`Using Board: ${board.name} (${board.id})`);

        const caseRes = await fetch(`${API_URL}/cases`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                title: 'Test Email Case',
                boardId: board.id,
                description: 'Testing email integration'
            })
        });

        if (!caseRes.ok) throw new Error(`Failed to create case: ${caseRes.statusText}`);
        const kase = await caseRes.json();
        console.log(`Case Created: ${kase.id}`);
        console.log(`Email Slug: ${kase.emailSlug}`);

        if (!kase.emailSlug) throw new Error('Email Slug not generated!');

        console.log('2. Sending Mock Inbound Email...');
        const slug = kase.emailSlug;

        const formData = new FormData();
        formData.append('to', `Test Card <card-${slug}@test.com>`);
        formData.append('from', 'sender@external.com');
        formData.append('subject', 'Updates on the project');
        formData.append('text', 'Here is the update regarding the case.');
        formData.append('html', '<p>Here is the update regarding the case.</p>');

        const webhookRes = await fetch(`${API_URL}/webhooks/sendgrid/inbound`, {
            method: 'POST',
            body: formData
        });

        if (!webhookRes.ok) throw new Error(`Webhook failed: ${webhookRes.statusText}`);
        console.log('Webhook sent.');

        console.log('3. Verifying Email in Case...');
        const verifyRes = await fetch(`${API_URL}/cases/${kase.id}/emails`, { headers: authHeaders });
        const emails = await verifyRes.json();

        if (emails.length > 0) {
            console.log('SUCCESS: Email found in case!');
            console.log(emails[0]);
        } else {
            console.error('FAILURE: No emails found in case.');
        }

    } catch (e: any) {
        console.error('Test Failed:', e.message);
    }
}

main();
