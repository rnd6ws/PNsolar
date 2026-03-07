import { getEmployees } from '../src/services/nhan-vien.service';

async function test() {
    console.log('Fetching employees...');
    const result = await getEmployees();
    console.log('Result:', JSON.stringify(result, null, 2));
}

test();
