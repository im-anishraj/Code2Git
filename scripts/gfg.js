/* Enum for languages supported by GeeksForGeeks. */
// const gfgLanguages = {
//   Python3: '.py',
//   'C++': '.cpp',
//   Java: '.java',
//   Javascript: '.js',
// };

/* Commit messages */
const README_MSG = 'Create README - Code to Git';
const SUBMIT_MSG = 'Added solution - Code to Git';
const UPDATE_MSG = 'Updated solution - Code to Git';
let START_MONITOR = true;
const toKebabCase = string => {
  return string
    .replace(/[^a-zA-Z0-9\. ]/g, '') // remove special chars
    .replace(/([a-z])([A-Z])/g, '$1-$2') // get all lowercase letters that are near to uppercase ones
    .replace(/[\s_]+/g, '-') // replace all spaces and low dash
    .toLowerCase(); // convert to lower case
};

function findGfgLanguage() {
  const ele = document.getElementsByClassName('divider text')[0].innerText;
  const lang = ele.split('(')[0].trim();
  if (lang.length > 0 && languages[lang]) {
    return languages[lang];
  }
  return null;
}

function findTitle() {
  const ele = document.querySelector('[class^="problems_header_content__title"] > h3').innerText;
  if (ele != null) {
    return ele;
  }
  return '';
}

function findDifficulty() {
  const ele = document.querySelectorAll('[class^="problems_header_description"]')[0].children[0]
    .innerText;

  if (ele != null) {
    if (ele.trim() == 'Basic' || ele.trim() === 'School') {
      return 'Easy';
    }
    return ele;
  }
  return '';
}

function getProblemStatement() {
  const ele = document.querySelector('[class^="problems_problem_content"]');
  return `${ele.outerHTML}`;
}

function getCode() {
  try {
    const monacoLines = document.querySelectorAll('.view-lines .view-line');
    if (monacoLines && monacoLines.length > 0) {
      return Array.from(monacoLines)
        .map((line) => line.textContent)
        .join('\n');
    }

    const aceLines = document.querySelectorAll('.ace_line');
    if (aceLines && aceLines.length > 0) {
      return Array.from(aceLines)
        .map((line) => line.textContent)
        .join('\n');
    }

    return '';
  } catch (e) {
    console.error('[Code-to-Git] Error extracting code:', e);
    return '';
  }
}

const gfgLoader = setInterval(() => {
  let code = null;
  let problemStatement = null;
  let title = null;
  let language = null;
  let difficulty = null;

  if (window.location.href.includes('practice.geeksforgeeks.org/problems')) {
    const submitBtn = document
      .evaluate(".//button[text()='Submit']", document.body, null, XPathResult.ANY_TYPE, null)
      .iterateNext();

    submitBtn.addEventListener('click', function () {
      START_MONITOR = true;
      const submission = setInterval(() => {
        const output = document.querySelectorAll('[class^="problems_content"]')[0].innerText;
        if (output.includes('Problem Solved Successfully') && START_MONITOR) {
          // clear timeout
          START_MONITOR = false;
          clearInterval(gfgLoader);
          clearInterval(submission);
          // get data
          title = findTitle().trim();
          difficulty = findDifficulty();
          problemStatement = getProblemStatement();
          code = getCode();
          language = findGfgLanguage();

          // format data
          const probName = `${title} - GFG`;

          problemStatement = `# ${title}\n## ${difficulty}\n${problemStatement}`;

          // if language was found
          if (language !== null) {
            chrome.storage.local.get('stats', s => {
              const { stats } = s;
              const fileName = toKebabCase(title + language);
              const filePath = probName + fileName;
              let sha = null;
              if (
                stats !== undefined &&
                stats.shas !== undefined &&
                stats.shas[probName] !== undefined &&
                stats.shas[probName][fileName] !== undefined
              ) {
                sha = stats.shas[probName][fileName];
              }

              // Only create README if not already created
              // if (sha === null) {
              uploadGit(
                btoa(unescape(encodeURIComponent(problemStatement))),
                probName,
                'README.md',
                README_MSG,
                'upload',
                undefined,
                undefined,
                difficulty
              );
              // }

              if (code !== '') {
                setTimeout(function () {
                  uploadGit(
                    btoa(unescape(encodeURIComponent(code))),
                    probName,
                    toKebabCase(title + language),
                    SUBMIT_MSG,
                    'upload',
                    undefined,
                    undefined,
                    difficulty
                  );
                }, 1000);
              }
            });
          }
        } else if (output.includes('Compilation Error')) {
          // clear timeout and do nothing
          clearInterval(submission);
        } else if (
          !START_MONITOR &&
          (output.includes('Compilation Error') || output.includes('Correct Answer'))
        ) {
          clearInterval(submission);
        }
      }, 1000);
    });
  }
}, 1000);
