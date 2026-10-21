// Passes the requested document through the request form to the thank-you
// page, where the real download link is revealed after submission.
(function () {
  function param(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  // Only one of this site's own advisory PDFs may become a link: anything else in the address (another site,
  // a script) is dropped, and the button keeps its plain link to the advisories page (security review, CS5).
  function advisoryPath(v) {
    return v && /^advisories\/[a-z0-9-]+\.pdf$/.test(v) ? v : null;
  }

  // request.html: show which document was requested and carry it through
  // Formspree's redirect (_next) and into the emailed submission.
  var docTitleEl = document.getElementById('doc-title');
  if (docTitleEl) {
    var path = advisoryPath(param('doc'));
    var title = param('title') || 'this document';
    docTitleEl.textContent = title;

    var docField = document.getElementById('doc-field');
    if (docField) docField.value = path ? title + ' (' + path + ')' : title;

    var nextField = document.getElementById('next-field');
    if (nextField) {
      nextField.value = path ? 'thanks.html?doc=' + encodeURIComponent(path) + '&title=' + encodeURIComponent(title) : 'thanks.html';
    }
  }

  // request.html: submit via fetch so we control the post-submission
  // redirect ourselves, rather than relying on Formspree's server-side
  // "_next" redirect (which requires a paid Formspree plan).
  var form = document.getElementById('request-form');
  if (form) {
    var errorEl = document.getElementById('form-error');
    var submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (errorEl) errorEl.hidden = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      }).then(function (response) {
        if (response.ok) {
          window.location.href = document.getElementById('next-field').value;
        } else {
          throw new Error('Form submission failed');
        }
      }).catch(function () {
        if (errorEl) errorEl.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Continue to download';
      });
    });
  }

  // thanks.html: reveal the real download link for the requested document.
  var thanksTitleEl = document.getElementById('thanks-title');
  if (thanksTitleEl) {
    var thanksPath = advisoryPath(param('doc'));
    var thanksTitle = param('title') || 'your document';
    thanksTitleEl.textContent = thanksTitle;

    var downloadLink = document.getElementById('thanks-download');
    if (downloadLink && thanksPath) {
      downloadLink.href = thanksPath;
      downloadLink.setAttribute('download', '');
    }
  }
})();
