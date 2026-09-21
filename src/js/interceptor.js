// Store reference to solution posts for communication with content script
window.code2gitSolutionPosts = [];

// 1. Intercept fetch requests
const originalFetch = window.fetch;

window.fetch = async function (...args) {
  const [resource, options] = args;
  const url = typeof resource === 'string' ? resource : resource?.url;
  const method = options?.method || 'GET';

  console.log('[Code2Git Fetch Intercept]', url, method);

  const response = await originalFetch.apply(this, args);
  if (url?.includes('/problems/') && url?.includes('/submit/')) {
    try {
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();

      if (data?.submission_id) {
        console.log('Code2Git: Submission ID detected', data.submission_id);
        window.dispatchEvent(
          new CustomEvent('code2gitSubmissionId', {
            detail: { submissionId: data.submission_id }
          })
        );
      }
    } catch (e) {
      console.log('Code2Git: Error parsing submission response', e);
    }
  }

  if (url?.includes('/graphql/') && method === 'POST') {
    console.log('Code2Git: GraphQL POST detected via fetch');
    try {
      const body = JSON.parse(options?.body || '{}');
      console.log('Code2Git: GraphQL operation:', body.operationName);
      if (body.operationName === 'ugcArticlePublishSolution') {
        console.log('Code2Git: Solution post operation detected!');
        const solutionData = body.variables?.data;
        console.log('Code2Git: Solution data:', solutionData);
        if (solutionData?.questionSlug && solutionData?.content) {
          console.log('Code2Git: Valid solution data found, storing for processing...');
          // Store the solution data for the content script to process
          window.code2gitSolutionPosts.push({
            questionSlug: solutionData.questionSlug,
            content: solutionData.content,
            title: solutionData.title,
            timestamp: Date.now(),
          });

          window.dispatchEvent(
            new CustomEvent('code2gitSolutionPost', {
              detail: {
                questionSlug: solutionData.questionSlug,
                content: solutionData.content,
                title: solutionData.title,
              },
            }),
          );
        } else {
          console.log('Code2Git: Missing questionSlug or content in solution data');
        }
      }
    } catch (error) {
      console.log('Code2Git: Error parsing GraphQL body:', error);
    }
  }

  return response;
};

// 2. Intercept XMLHttpRequest (fallback)
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function (method, url, ...args) {
  this._code2git_url = url;
  this._code2git_method = method;
  console.log('Code2Git: XHR open intercepted', method, url);
  return originalXHROpen.apply(this, [method, url, ...args]);
};

XMLHttpRequest.prototype.send = function (data) {
  if (
    this._code2git_url?.includes('/graphql/') &&
    this._code2git_method === 'POST'
  ) {
    console.log('Code2Git: GraphQL POST detected via XHR');

    try {
      const body = JSON.parse(data || '{}');
      console.log('Code2Git: XHR GraphQL operation:', body.operationName);
      if (body.operationName === 'ugcArticlePublishSolution') {
        console.log('Code2Git: Solution post operation detected via XHR!');
        const solutionData = body.variables?.data;
        console.log('Code2Git: XHR Solution data:', solutionData);
        if (solutionData?.questionSlug && solutionData?.content) {
          console.log('Code2Git: Valid solution data found via XHR, storing for processing...');
          // Store the solution data for the content script to process
          window.code2gitSolutionPosts.push({
            questionSlug: solutionData.questionSlug,
            content: solutionData.content,
            title: solutionData.title,
            timestamp: Date.now(),
          });
          // Dispatch custom event to notify content script
          window.dispatchEvent(
            new CustomEvent('code2gitSolutionPost', {
              detail: {
                questionSlug: solutionData.questionSlug,
                content: solutionData.content,
                title: solutionData.title,
              },
            }),
          );
        } else {
          console.log('Code2Git: Missing questionSlug or content in XHR solution data');
        }
      }
    } catch (error) {
      console.log('Code2Git: Error parsing XHR GraphQL body:', error);
    }
  }

  return originalXHRSend.apply(this, [data]);
};

// 3. GeeksForGeeks Code Extractor
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'FETCH_GFG_CODE') {
    let code = '';
    try {
      if (typeof monaco !== 'undefined' && monaco.editor.getModels().length > 0) {
        code = monaco.editor.getModels()[0].getValue();
      } else if (typeof ace !== 'undefined') {
        const aceEditorElement = document.querySelector('.ace_editor');
        if (aceEditorElement) {
          const editor = ace.edit(aceEditorElement);
          if (editor) code = editor.getValue();
        }
      }
    } catch(err) {
      console.log('Code2Git: GFG extraction error', err);
    }
    window.postMessage({ type: 'GFG_CODE_RESULT', code: code }, '*');
  }
});

console.log('Code2Git: Request interceptors installed in page context');
