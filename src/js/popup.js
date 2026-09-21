/* global oAuth2 */

let action = false;

$('#authenticate').on('click', () => {
  if (action) {
    oAuth2.begin();
  }
});

$('#welcome_URL').attr('href', chrome.runtime.getURL('src/html/welcome.html'));

$('#hook_URL').attr('href', chrome.runtime.getURL('src/html/welcome.html'));
$('#setup_more_hook_URL').attr('href', chrome.runtime.getURL('src/html/welcome.html'));

$('#collapsible-commit-message-icon').parent().click(() => {
  const icon = $('#collapsible-commit-message-icon');
  const container = $('#collapsible-commit-message-container');
  container.toggle();
  icon.html(container.is(':visible') ? '&#9660;' : '&#9654;');
  chrome.storage.local.get(['custom_commit_message'], data => {
    console.log('data after toggling', data);
    let commitMessage = data.custom_commit_message;

    // if null, undefined, or an empty string, set default placeholder
    if (!commitMessage) {
      $('#custom-commit-msg').attr('placeholder', 'Time: {time}, Space: {space} - Code2Git');
    } else {
      $('#custom-commit-msg').attr('placeholder', commitMessage);
      $('#custom-commit-msg').val(commitMessage);
    }
  });
});

// Toggle difficulty folder section
$('#collapsible-difficulty-icon').parent().click(() => {
  const icon = $('#collapsible-difficulty-icon');
  const container = $('#collapsible-difficulty-container');
  container.toggle();
  icon.html(container.is(':visible') ? '&#9660;' : '&#9654;');

  // Load from storage: use default value 'false' if not set
  chrome.storage.local.get({ useDifficultyFolder: false }, data => {
    $('#use-difficulty-folder').prop('checked', data.useDifficultyFolder);
  });
});

// Store Switch State
$('#use-difficulty-folder').change(function () {
  const isChecked = $(this).is(':checked');
  chrome.storage.local.set({ useDifficultyFolder: isChecked });
});

// Toggle language folder section
$('#collapsible-language-icon').parent().click(() => {
  const icon = $('#collapsible-language-icon');
  const container = $('#collapsible-language-container');
  container.toggle();
  icon.html(container.is(':visible') ? '&#9660;' : '&#9654;');

  // Load from storage: use default value 'false' if not set
  chrome.storage.local.get({ useLanguageFolder: false }, data => {
    $('#use-language-folder').prop('checked', data.useLanguageFolder);
  });
});

// Store Switch State
$('#use-language-folder').change(function () {
  const isChecked = $(this).is(':checked');
  chrome.storage.local.set({ useLanguageFolder: isChecked });
});

// Toggle timestamped filenames section
$('#collapsible-timestamp-icon').parent().click(() => {
  const icon = $('#collapsible-timestamp-icon');
  const container = $('#collapsible-timestamp-container');
  container.toggle();
  icon.html(container.is(':visible') ? '&#9660;' : '&#9654;');

  // Load stored toggle state
  chrome.storage.local.get({ useTimestampFilename: false }, data => {
    $('#use-timestamp-filename').prop('checked', data.useTimestampFilename);
  });
});

// Save toggle state when checkbox changes
$('#use-timestamp-filename').change(function () {
  const isChecked = $(this).is(':checked');
  chrome.storage.local.set({ useTimestampFilename: isChecked });
});

// Toggle solution post section
$('#collapsible-solution-post-icon').parent().click(() => {
  const icon = $('#collapsible-solution-post-icon');
  const container = $('#collapsible-solution-post-container');
  container.toggle();
  icon.html(container.is(':visible') ? '&#9660;' : '&#9654;');

  // Load from storage: use default value 'true' if not set (default enabled)
  chrome.storage.local.get({ autoCommitSolutionPost: true }, data => {
    $('#auto-commit-solution-post').prop('checked', data.autoCommitSolutionPost);
  });
});

// Store Switch State
$('#auto-commit-solution-post').change(function () {
  const isChecked = $(this).is(':checked');
  chrome.storage.local.set({ autoCommitSolutionPost: isChecked });
});
// Toggle settings list visibility
$('#customize-settings-btn').click(() => {
  const settingsList = $('#settings-list-container');
  const arrow = $('#customize-arrow');
  if (settingsList.css('display') === 'none') {
    settingsList.css('display', 'flex');
    arrow.html('&#9660;');
  } else {
    settingsList.css('display', 'none');
    arrow.html('&#9654;');
  }
});

$('#msg-save-btn').click(() => {
  const commitMessage = $('#custom-commit-msg').val();
  chrome.runtime.sendMessage({
    action: 'customCommitMessageUpdated',
    message: commitMessage.trim(),
  });

  const successMessage = $('#success-message');
  successMessage.show();
  setTimeout(() => {
    successMessage.hide();
  }, 3000);
});

$('#msg-reset-btn').click(() => {
  $('#custom-commit-msg').val('');
  $('#custom-commit-msg').attr('placeholder', 'Time: {time}, Space: {space} - Code2Git'); // reset to default
  chrome.runtime.sendMessage({ action: 'customCommitMessageUpdated', message: null });
});

/* when variable is clicked, add to custom commit message text area*/
$('.commit-variable').on('click', function () {
  var variableName = $(this).attr('id');
  $('#custom-commit-msg').val(function (index, currentValue) {
    return currentValue + `{${variableName}} `;
  });
});

chrome.storage.local.get('code2git_token', data => {
  const token = data.code2git_token;
  if (token === null || token === undefined) {
    action = true;
    $('#auth_mode').show();
  } else {
    // To validate user, load user object from GitHub.
    const AUTHENTICATION_URL = 'https://api.github.com/user';

    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          /* Show MAIN FEATURES */
          chrome.storage.local.get(['mode_type', 'code2git_hook', 'gfg_hook'], data2 => {
            if (data2.code2git_hook || data2.gfg_hook) {
              $('#commit_mode').show();
              /* Get problem stats and repo link */
              chrome.storage.local.get(['stats', 'gfg_stats'], data3 => {
                const { stats, gfg_stats } = data3;
                if (stats && stats.solved) {
                  $('#p_solved').text(stats.solved);
                  $('#p_solved_easy').text(stats.easy);
                  $('#p_solved_medium').text(stats.medium);
                  $('#p_solved_hard').text(stats.hard);
                }
                if (gfg_stats && gfg_stats.solved) {
                  $('#gfg_p_solved').text(gfg_stats.solved);
                  $('#gfg_p_solved_easy').text(gfg_stats.easy);
                  $('#gfg_p_solved_medium').text(gfg_stats.medium);
                  $('#gfg_p_solved_hard').text(gfg_stats.hard);
                }
                const code2gitHook = data2.code2git_hook;
                if (code2gitHook) {
                  $('#repo_url').html(
                    `LeetCode: <a target="blank" style="color: cadetblue !important; font-size:0.8em;" href="https://github.com/${code2gitHook}">${code2gitHook}</a>`,
                  );
                }
                const gfgHook = data2.gfg_hook;
                if (gfgHook) {
                  $('#gfg_repo_url').html(
                    `GeeksForGeeks: <a target="blank" style="color: cadetblue !important; font-size:0.8em;" href="https://github.com/${gfgHook}">${gfgHook}</a>`,
                  );
                }
              });
            } else {
              $('#hook_mode').show();
            }
          });
        } else if (xhr.status === 401) {
          // bad oAuth: reset token and redirect to authorization process again!
          chrome.storage.local.set({ code2git_token: null }, () => {
            console.log('BAD oAuth!!! Redirecting back to oAuth process');
            action = true;
            $('#auth_mode').show();
          });
        }
      }
    });
    xhr.open('GET', AUTHENTICATION_URL, true);
    xhr.setRequestHeader('Authorization', `token ${token}`);
    xhr.send();
  }
});
