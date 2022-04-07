import GithubFetcher from './GithubFetcher.js';
import { readFileSync, writeFileSync } from 'fs';
import { exit } from 'process';

(async () => {
    let repos = [];
    let repo_file = process.argv[2];
    if (!repo_file) {
        console.log('no repo file specified hence using the sample repos i.e. "src/scripts/sample_repos.json"');
        repo_file = 'src/scripts/sample_repos.json';
    }
    try {
        repos = JSON.parse(readFileSync(repo_file, 'utf8'));
    } catch {
        console.error(`oops! couldn't read the file ${repo_file}`);
        exit(1);
    }

    const fetcher = new GithubFetcher('Z2hwX29XQWdNS3gxeXNHRXBlTzV6OEdpdWZvNjc0WkhWZTN0bVlJVQ==');

    const formatDate = ts => {
        const _ = val => val.toString().padStart(2, '0')
        const date = new Date(ts);
        return `${date.getFullYear()}-${_(date.getMonth() + 1)}-${_(date.getDate())}`;
    };

    const generateStats = async (repo, method) => {
        const [owner, name] = repo.split('/');
        return new Promise(resolve => {
            fetcher[method](owner, name, resolve);
        });
    }

    const ATTRIBUTES = {
        star_count: 'fetchStargazerData',
        fork_count: 'fetchForkData',
        commit_count: 'fetchCommitData',
        issues_count: 'fetchIssuesData',
        pr_count: 'fetchRequestsData'
    };

    const ATTRIBUTE_COUNTS = Object.keys(ATTRIBUTES).length;

    const stats = [['repo_name', 'date', ...Object.keys(ATTRIBUTES)].join(',')];

    console.time('it took');
    for (const repo of repos) {
        console.log('fetching stats of', repo);
        const data = await Promise.all(Object.values(ATTRIBUTES).map(method => generateStats(repo, method)));
        const accumulators = Array.from({length: ATTRIBUTE_COUNTS}).fill(0);
        [...new Set(data.map(v => [...v.keys()]).flat())].sort((a, b) => a - b).forEach(v => {
            const headers = [repo, formatDate(+v)];
            for (let i = 0; i < ATTRIBUTE_COUNTS; i++) {
                accumulators[i] += data[i].get(v) || 0;
                headers.push(accumulators[i]);
            }
            stats.push(headers.join(','));
        });
    }
    console.timeEnd('it took');

    writeFileSync('src/scripts/stats.csv', stats.join('\n'));

    console.log('output written in "src/scripts/stats.csv"');
})();
