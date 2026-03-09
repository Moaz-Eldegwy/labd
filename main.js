// Handle Copy to Clipboard for Citation
function copyCitation() {
    const bibtex = document.getElementById('bibtex-content').innerText;
    const btn = document.getElementById('copyBtn');

    navigator.clipboard.writeText(bibtex).then(() => {
        // Success state styling
        btn.innerText = 'Copied!';
        btn.style.background = '#f0fdf4';
        btn.style.borderColor = '#86efac';
        btn.style.color = '#166534';

        // Reset state after 2 seconds
        setTimeout(() => {
            btn.innerText = 'Copy';
            btn.style.background = '#ffffff';
            btn.style.borderColor = '#d1d5db';
            btn.style.color = '#374151';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        btn.innerText = 'Failed';
        btn.style.background = '#fef2f2';
        btn.style.color = '#991b1b';
        btn.style.borderColor = '#fca5a5';

        setTimeout(() => {
            btn.innerText = 'Copy';
            btn.style.background = '#ffffff';
            btn.style.borderColor = '#d1d5db';
            btn.style.color = '#374151';
        }, 2000);
    });
}
