const displayWelcomePage = () => {
  const url = chrome.runtime.getURL('src/html/welcome.html');
  chrome.tabs.create({ url: url, active: true });
};

const closeTab = () => {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
    chrome.tabs.remove(tabs[0].id);
  });
};

const storageGet = keys => new Promise(resolve => chrome.storage.local.get(keys, resolve));
const storageSet = items => new Promise(resolve => chrome.storage.local.set(items, resolve));

function normalizeGitHubHook(hook) {
  if (!hook || typeof hook !== 'string') return hook;
  return hook.replace(/^https?:\/\/github\.com\//i, '').replace(/\/+$/, '');
}

function encodeGitHubPathSegment(segment) {
  return encodeURIComponent(segment).replace(/%2F/g, '/').replace(/%3A/g, ':');
}

function constructGitHubPath(
  hook,
  basePath,
  difficulty,
  problem,
  filename,
  useDifficultyFolder,
  useLanguageFolder = false,
  language,
) {
  const normalizedHook = normalizeGitHubHook(hook);
  const filePath = problem ? `${problem}/${filename}` : `${filename}`;

  let path;
  if (useLanguageFolder && language) {
    path = useDifficultyFolder
      ? `${language}/${difficulty}/${filePath}`
      : `${language}/${filePath}`;
  } else {
    path = useDifficultyFolder
      ? `${basePath}/${difficulty}/${filePath}`
      : `${filePath}`;
  }

  const encodedPath = path
    .split('/')
    .map(segment => encodeGitHubPathSegment(segment))
    .join('/');
  return `https://api.github.com/repos/${normalizedHook}/contents/${encodedPath}`;
}

async function getUpdatedData(
  token,
  hook,
  difficulty,
  problem,
  filename,
  useDifficultyFolder,
  useLanguageFolder,
  language,
) {
  const URL = constructGitHubPath(
    hook,
    'GeeksForGeeks',
    difficulty,
    problem,
    filename,
    useDifficultyFolder,
    useLanguageFolder,
    language,
  );

  const options = {
    method: 'GET',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  };

  const res = await fetch(URL, options);
  if (res.status === 200 || res.status === 201) {
    return await res.json();
  }
  throw new Error(`${res.status}`);
}

async function uploadFile(
  token,
  hook,
  content,
  problem,
  filename,
  commitMsg,
  useDifficultyFolder,
  useLanguageFolder,
  language,
  difficulty,
  existingSha = '',
) {
  const URL = constructGitHubPath(
    hook,
    'GeeksForGeeks',
    difficulty,
    problem,
    filename,
    useDifficultyFolder,
    useLanguageFolder,
    language,
  );

  let body = { message: commitMsg, content };
  if (existingSha) {
    body.sha = existingSha;
  }

  const options = {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify(body),
  };

  let res = await fetch(URL, options);
  if (res.status === 200 || res.status === 201) {
    return await res.json();
  }

  if (res.status === 409 || res.status === 422) {
    const data = await getUpdatedData(
      token,
      hook,
      difficulty,
      problem,
      filename,
      useDifficultyFolder,
      useLanguageFolder,
      language,
    );
    body.sha = data.sha;
    const retryOptions = {
      method: 'PUT',
      headers: options.headers,
      body: JSON.stringify(body),
    };
    const retryRes = await fetch(URL, retryOptions);
    if (retryRes.status === 200 || retryRes.status === 201) {
      return await retryRes.json();
    }
    const text = await retryRes.text();
    throw new Error(`GitHub upload failed after retry: ${retryRes.status} ${text}`);
  }

  const text = await res.text();
  throw new Error(`GitHub upload failed: ${res.status} ${text}`);
}

const handleMessage = (request, sender, sendResponse) => {
  if (!request) {
    console.log('Received undefined message');
    return;
  }

  if (request.action === 'customCommitMessageUpdated') {
    chrome.storage.local.set({ custom_commit_message: request.message });
  }

  if (request.action === 'uploadSolution') {
    uploadSolution(request.payload)
      .then(result => sendResponse(result))
      .catch(error => {
        console.error('Background upload error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.closeWebPage) {
    if (request.isSuccess) {
      chrome.storage.local.set({ code2git_username: request.username });
      chrome.storage.local.set({ code2git_token: request.token });
      chrome.storage.local.set({ pipe_code2git: false }, () => {});
      closeTab();
      displayWelcomePage();
    } else {
      alert('Error while trying to authenticate your profile!');
      closeTab();
    }
  }
};

chrome.runtime.onMessage.addListener(handleMessage);
function sortTopicsInReadme(markdownFile, platformPrefix, topicType = 'Topics') {
  const sectionPrefix = topicType ? `${platformPrefix} ${topicType}` : `${platformPrefix} Topics`;
  
  const secStart = `<!---${sectionPrefix} Start-->`;
  const secHeader = `# ${sectionPrefix}`;
  const secEnd = `<!---${sectionPrefix} End-->`;

  let secStartIndex = markdownFile.indexOf(secStart);
  if (secStartIndex === -1) return markdownFile;

  let beforeSection = markdownFile.slice(0, markdownFile.indexOf(secStart));
  const afterSection = markdownFile.slice(
    markdownFile.indexOf(secEnd) + secEnd.length,
  );

  const sectionContent = markdownFile.match(
    new RegExp(`${secStart}([\\s\\S]*)${secEnd}`),
  )?.[1];
  if (sectionContent == null) return markdownFile;

  let topics = sectionContent.trim().split('## ');
  topics.shift();

  topics = topics.map(section => {
    let lines = section.trim().split('\n');
    const topic = lines.shift();

    let topicHeaderIndex = markdownFile.indexOf(`## ${topic}`);
    let startIndex = markdownFile.indexOf(secStart);
    if (topicHeaderIndex < startIndex) {
      const endTopicString = markdownFile.slice(topicHeaderIndex).match(/\|\n[^|]/)?.[0];
      if (endTopicString == null) return ['## ' + topic].concat('| Problem Name | Difficulty |', '| ------- | ------- |', lines).join('\n');

      const endTopicIndex = markdownFile.indexOf(endTopicString, topicHeaderIndex + 1);
      const topicSection = markdownFile.slice(topicHeaderIndex, endTopicIndex + 1);
      const problemsToMerge = topicSection.trim().split('\n').slice(3);

      lines = lines.concat(problemsToMerge).reduce((array, element) => {
        if (!array.includes(element)) array.push(element);
        return array;
      }, []);

      beforeSection =
        markdownFile.slice(0, topicHeaderIndex) +
        markdownFile.slice(endTopicIndex + 1, markdownFile.indexOf(secStart));
    }

    lines = lines.slice(2);

    lines.sort((a, b) => {
      let matchA = a.match(/\/(\d+)-/);
      let matchB = b.match(/\/(\d+)-/);
      if (matchA && matchB) {
        return parseInt(matchA[1]) - parseInt(matchB[1]);
      }
      return a.localeCompare(b);
    });

    return ['## ' + topic].concat('| Problem Name | Difficulty |', '| ------- | ------- |', lines).join('\n');
  });

  return [beforeSection, secStart, secHeader, '\n' + topics.join('\n\n') + '\n', secEnd, afterSection].join('\n');
}

async function appendProblemToReadme(topic, markdownFile, hook, problem, difficulty, language, useDifficultyFolder, useLanguageFolder, basePath, platformPrefix, topicType = 'Topics') {
  const filePath = problem ? `${problem}/` : '';

  let path = '';
  if (useLanguageFolder && language) {
    path = useDifficultyFolder
      ? `${language}/${difficulty}/${filePath}`
      : `${language}/${filePath}`;
  } else {
    path = useDifficultyFolder
    ? `${basePath}/${difficulty}/${filePath}`
    : `${filePath}`;
  }

  if (!path) return markdownFile;

  const url = `https://github.com/${hook}/tree/main/${path}`;

  const topicHeader = `## ${topic}`;
  const topicTableHeader = `\n${topicHeader}\n| Problem Name | Difficulty |\n| ------- | ------- |\n`;
  const newRow = `| [${problem}](${url}) | ${difficulty} |\n`;

  const sectionPrefix = topicType ? `${platformPrefix} ${topicType}` : `${platformPrefix} Topics`;
  
  const secStart = `<!---${sectionPrefix} Start-->`;
  const secHeader = `# ${sectionPrefix}`;
  const secEnd = `<!---${sectionPrefix} End-->`;

  let secStartIndex = markdownFile.indexOf(secStart);
  if (secStartIndex === -1) {
    markdownFile +=
      '\n<hr>\n\n' + [secStart, secHeader, secEnd].join('\n');
    secStartIndex = markdownFile.indexOf(secStart);
  }

  const beforeSection = markdownFile.slice(0, markdownFile.indexOf(secStart));
  const afterSection = markdownFile.slice(
    markdownFile.indexOf(secEnd) + secEnd.length,
  );

  let sectionContent = markdownFile.slice(
    markdownFile.indexOf(secStart) + secStart.length,
    markdownFile.indexOf(secEnd),
  );

  let topicTableIndex = sectionContent.indexOf(topicHeader);
  if (topicTableIndex === -1) {
    sectionContent += topicTableHeader;
    topicTableIndex = sectionContent.indexOf(topicHeader);
  }

  const endTopicString = sectionContent.slice(topicTableIndex).match(/\|\n[^|]/)?.[0];
  const endTopicIndex = (endTopicString != null) ? sectionContent.indexOf(endTopicString, topicTableIndex + 1) : -1;
  let topicTable =
    endTopicIndex === -1
      ? sectionContent.slice(topicTableIndex)
      : sectionContent.slice(topicTableIndex, endTopicIndex + 1);
  topicTable = topicTable.trim();

  const problemIndex = topicTable.indexOf(problem);
  if (problemIndex !== -1) {
    return markdownFile;
  }

  topicTable = [topicTable, newRow, '\n'].join('\n');

  sectionContent =
    sectionContent.slice(0, topicTableIndex) +
    topicTable +
    (endTopicIndex === -1 ? '' : sectionContent.slice(endTopicIndex + 1));

  markdownFile = [
    beforeSection,
    secStart,
    sectionContent,
    secEnd,
    afterSection,
  ].join('');

  return markdownFile;
}

async function updateReadmeTopicTagsWithProblem(payload, token, hook, stats) {
  const topicTags = payload.topicTags;
  const problemName = payload.problemName;
  if (!topicTags || topicTags.length === 0) {
    console.log('Code2Git: No topic tags provided, skipping root README generation.');
    return stats;
  }
  
  console.log('Code2Git: Updating Root README with topics:', topicTags);

  const readmeFilename = 'README.md';
  const defaultRepoReadme = "Contains topicwise list of solved problems.\n\n";

  let readme = '';
  let newSha = '';

  try {
    console.log('Code2Git: Fetching root README data...');
    const data = await getUpdatedData(token, hook, '', '', readmeFilename, false, false, '');
    console.log('Code2Git: Existing Root README found!');
    newSha = data.sha;
    readme = decodeURIComponent(escape(atob(data.content)));
    stats.shas[readmeFilename] = { '': data.sha };
  } catch (err) {
    console.log('Code2Git: Error fetching README:', err.message);
    if (err.message.includes('404')) {
      console.log('Code2Git: Creating initial Root README...');
      const initialContent = btoa(unescape(encodeURIComponent(defaultRepoReadme)));
      try {
        const uploadResponse = await uploadFile(token, hook, initialContent, '', readmeFilename, 'Initialize README.md', false, false, '', '', '');
        if (uploadResponse && uploadResponse.content) {
           newSha = uploadResponse.content.sha;
        }
        readme = defaultRepoReadme;
        stats.shas[readmeFilename] = { '': newSha };
      } catch (uploadErr) {
        console.log(`Code2Git: Error creating README: ${uploadErr.message}`);
        return stats;
      }
    } else {
      console.log(`Code2Git: Fatal error fetching README: ${err.message}`);
      return stats;
    }
  }

  console.log('Code2Git: Appending problems...');
  const platformPrefix = payload.isGFG ? 'GeeksForGeeks' : 'LeetCode';
  const basePath = platformPrefix;

  for (const topic of topicTags) {
    try {
      readme = await appendProblemToReadme(topic.name, readme, hook, problemName, payload.difficulty, payload.language, payload.useDifficultyFolder, payload.useLanguageFolder, basePath, platformPrefix, topic.type);
    } catch(e) { console.log('Code2Git: Error in append:', e); }
  }

  const types = new Set(topicTags.map(t => t.type || 'Topics'));
  for (const type of types) {
    try {
      readme = sortTopicsInReadme(readme, platformPrefix, type);
    } catch(e) { console.log('Code2Git: Error in sort:', e); }
  }

  console.log('Code2Git: Pushing updated Root README...');
  const encodedReadme = btoa(unescape(encodeURIComponent(readme)));
  try {
    const rootReadmeResult = await uploadFile(token, hook, encodedReadme, '', readmeFilename, `Add ${problemName} to topics.`, false, false, '', '', newSha);
    if (rootReadmeResult && rootReadmeResult.content) {
      stats.shas[readmeFilename] = { '': rootReadmeResult.content.sha };
    }
  } catch (err) {
    console.log(`Error updating README: ${err.message}`);
  }
  return stats;
}

async function uploadSolution(payload) {
  const hookKey = payload.isGFG ? 'gfg_hook' : 'code2git_hook';
  const statsKey = payload.isGFG ? 'gfg_stats' : 'stats';

  const data = await storageGet([
    'code2git_token',
    hookKey,
    statsKey,
    'mode_type',
  ]);

  const token = data.code2git_token;
  const hook = data[hookKey];
  const modeType = data.mode_type;
  const useDifficultyFolder = payload.useDifficultyFolder || false;
  const useLanguageFolder = payload.useLanguageFolder || false;

  if (modeType !== 'commit') {
    throw new Error('code2git mode is not commit');
  }
  if (!token) {
    throw new Error('code2git token is undefined');
  }
  if (!hook) {
    throw new Error('repo hook not defined');
  }

  let stats = data[statsKey] || { solved: 0, easy: 0, medium: 0, hard: 0, shas: {} };
  if (!stats.shas) stats.shas = {};
  if (!stats.shas[payload.problemName]) stats.shas[payload.problemName] = {};

  // Upload Problem README.md
  if (payload.probStatement) {
    const existingReadmeSha = stats.shas[payload.problemName]['README.md'] || '';
    if (!existingReadmeSha) {
        try {
            const readmeResult = await uploadFile(
              token, hook, payload.probStatement, payload.problemName, 'README.md', `Create readme : ${payload.problemName}`,
              useDifficultyFolder, useLanguageFolder, payload.language, payload.difficulty, existingReadmeSha
            );
            stats.shas[payload.problemName]['README.md'] = readmeResult.content.sha;
        } catch (e) {
            console.log('Error uploading README.md:', e.message);
        }
    }
  }

  // Upload NOTES.md
  if (payload.notes) {
    const existingNotesSha = stats.shas[payload.problemName]['NOTES.md'] || '';
    try {
        const notesResult = await uploadFile(
          token, hook, payload.notes, payload.problemName, 'NOTES.md', `Attach Notes : ${payload.problemName}`,
          useDifficultyFolder, useLanguageFolder, payload.language, payload.difficulty, existingNotesSha
        );
        stats.shas[payload.problemName]['NOTES.md'] = notesResult.content.sha;
    } catch (e) {
        console.log('Error uploading NOTES.md:', e.message);
    }
  }

  // Upload CODE
  const existingCodeSha = stats.shas[payload.problemName][payload.fileName] || '';
  const codeResult = await uploadFile(
    token, hook, payload.code, payload.problemName, payload.fileName, payload.commitMsg,
    useDifficultyFolder, useLanguageFolder, payload.language, payload.difficulty, existingCodeSha
  );
  stats.shas[payload.problemName][payload.fileName] = codeResult.content.sha;

  // Update Root README
  stats = await updateReadmeTopicTagsWithProblem(payload, token, hook, stats);

  if (!payload.alreadyCompleted) {
    stats.solved += 1;
    if (payload.difficulty === 'Easy') stats.easy += 1;
    if (payload.difficulty === 'Medium') stats.medium += 1;
    if (payload.difficulty === 'Hard') stats.hard += 1;
  }

  await storageSet({ [statsKey]: stats });
  return { success: true };
}
