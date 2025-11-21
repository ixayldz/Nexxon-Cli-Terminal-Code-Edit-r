#!/usr/bin/env node
/**
 * Nexxon CLI Benchmarking Suite
 * PRD Section 17: Performance Benchmark Protocol
 *
 * Measures:
 * - Time to first valid diff
 * - Time to passing tests
 * - Number of iterations
 * - Diff acceptance rate
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';

const execAsync = promisify(exec);

interface BenchmarkTask {
    name: string;
    category: 'bug_fix' | 'refactor' | 'feature';
    description: string;
    repoPath: string;
    targetFile: string;
}

interface BenchmarkResult {
    task: string;
    category: string;
    timeToFirstDiff: number;
    timeToPassingTests: number;
    iterations: number;
    diffAccepted: boolean;
    testsPassed: boolean;
}

const TASKS: BenchmarkTask[] = [
    {
        name: 'fix-null-pointer',
        category: 'bug_fix',
        description: 'Fix null pointer error in main.ts',
        repoPath: 'repos/small/nodejs-express',
        targetFile: 'src/main.ts'
    },
    {
        name: 'extract-method',
        category: 'refactor',
        description: 'Extract validation logic into separate function',
        repoPath: 'repos/small/nodejs-express',
        targetFile: 'src/validators.ts'
    },
    {
        name: 'add-endpoint',
        category: 'feature',
        description: 'Add REST endpoint for user profile',
        repoPath: 'repos/small/nodejs-express',
        targetFile: 'src/routes/users.ts'
    }
];

async function runBenchmark(task: BenchmarkTask): Promise<BenchmarkResult> {
    const startTime = Date.now();
    console.log(`\\n🎯 Running benchmark: ${task.name}`);
    console.log(`   Category: ${task.category}`);
    console.log(`   Description: ${task.description}`);

    // Baseline: Run Nexxon CLI to generate diff
    const diffStartTime = Date.now();
    try {
        const { stdout } = await execAsync(
            `nexxon diff --task "${task.description}" --file "${task.targetFile}" --no-interactive`,
            { cwd: path.resolve(task.repoPath), timeout: 30000 }
        );
        const timeToFirstDiff = Date.now() - diffStartTime;

        // Run tests
        const testStartTime = Date.now();
        let testsPassed = false;
        try {
            await execAsync('npm test', { cwd: path.resolve(task.repoPath), timeout: 60000 });
            testsPassed = true;
        } catch {
            testsPassed = false;
        }
        const timeToPassingTests = testsPassed ? Date.now() - testStartTime : -1;

        return {
            task: task.name,
            category: task.category,
            timeToFirstDiff,
            timeToPassingTests,
            iterations: 1,
            diffAccepted: stdout.includes('hasChanges'),
            testsPassed
        };
    } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        return {
            task: task.name,
            category: task.category,
            timeToFirstDiff: -1,
            timeToPassingTests: -1,
            iterations: 0,
            diffAccepted: false,
            testsPassed: false
        };
    }
}

async function main() {
    console.log('🚀 Nexxon CLI Benchmark Suite');
    console.log('PRD Section 17: Performance Benchmark Protocol\\n');

    const results: BenchmarkResult[] = [];

    for (const task of TASKS) {
        const result = await runBenchmark(task);
        results.push(result);
    }

    // Generate report
    console.log('\\n📊 Benchmark Results:\\n');
    console.log('Task                    | Category   | Time to Diff | Time to Test | Accepted | Passed');
    console.log('------------------------|------------|--------------|--------------|----------|--------');

    for (const r of results) {
        const diffTime = r.timeToFirstDiff > 0 ? `${r.timeToFirstDiff}ms` : 'FAIL';
        const testTime = r.timeToPassingTests > 0 ? `${r.timeToPassingTests}ms` : 'FAIL';
        const accepted = r.diffAccepted ? '✅' : '❌';
        const passed = r.testsPassed ? '✅' : '❌';

        console.log(
            `${r.task.padEnd(23)} | ${r.category.padEnd(10)} | ${diffTime.padEnd(12)} | ${testTime.padEnd(12)} | ${accepted.padEnd(8)} | ${passed}`
        );
    }

    // Save results
    const reportPath = 'artifacts/benchmark-report.json';
    await fs.mkdir('artifacts', { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
    console.log(`\\n✅ Report saved to ${reportPath}`);

    // Calculate metrics
    const totalTasks = results.length;
    const acceptedDiffs = results.filter(r => r.diffAccepted).length;
    const passedTests = results.filter(r => r.testsPassed).length;
    const acceptanceRate = (acceptedDiffs / totalTasks) * 100;
    const passRate = (passedTests / totalTasks) * 100;

    console.log(`\\n📈 Summary:`);
    console.log(`   Diff Acceptance Rate: ${acceptanceRate.toFixed(1)}% (target >= 80%)`);
    console.log(`   Test Pass Rate: ${passRate.toFixed(1)}% (target >= 95%)`);
}

main().catch(console.error);
