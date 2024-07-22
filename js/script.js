const editions = [
    'eng-bukhari',
    'eng-muslim',
    'eng-nasai',
    'eng-abudawud',
    'eng-tirmidhi',
    'eng-ibnmajah',
    'eng-malik',
    'eng-dehlawi',
    'eng-nawawi',
    'eng-qudsi'
];

async function fetchAPI(endpoint) {
    const maxRetries = 3;
    const urlMin = `https://${config.apiHost}/${endpoint}.min.json`;
    const urlFull = `https://${config.apiHost}/${endpoint}.json`;

    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const response = await fetch(urlMin);
            if (response.ok) {
                return await response.json();
            }
            throw new Error(`Minified JSON fetch failed with status: ${response.status}`);
        } catch (error) {
            console.error(`Error fetching ${urlMin}:`, error);
            try {
                const response = await fetch(urlFull);
                if (response.ok) {
                    return await response.json();
                }
                throw new Error(`Full JSON fetch failed with status: ${response.status}`);
            } catch (fallbackError) {
                console.error(`Error fetching ${urlFull}:`, fallbackError);
                attempt++;
                if (attempt >= maxRetries) {
                    return { error: 'An error occurred. Please try again later.' };
                }
            }
        }
    }
}

async function fetchRandomHadith() {
    // Randomly select an edition
    const randomEdition = editions[Math.floor(Math.random() * editions.length)];
    console.log(`Selected Edition: ${randomEdition}`);  // Debugging line to see which edition was selected

    // Fetch volume information
    const volumeEndpoint = `editions/${randomEdition}`;
    const volumeData = await fetchAPI(volumeEndpoint);

    if (volumeData.error || !volumeData.sections) {
        document.getElementById('hadith').innerText = volumeData.error || 'Failed to load volume data.';
        document.getElementById('details').innerHTML = '';
        return;
    }

    const sections = Object.keys(volumeData.sections).filter(key => !isNaN(key));
    if (sections.length === 0) {
        document.getElementById('hadith').innerText = 'No sections available.';
        document.getElementById('details').innerHTML = '';
        return;
    }

    const randomSectionKey = sections[Math.floor(Math.random() * sections.length)];

    // Get section data
    const sectionDetails = volumeData.section_details[randomSectionKey];
    const sectionEndpoint = `editions/${randomEdition}/sections/${randomSectionKey}`;
    const sectionData = await fetchAPI(sectionEndpoint);

    if (sectionData.error || !sectionDetails) {
        document.getElementById('hadith').innerText = sectionData.error || 'Failed to load section data.';
        document.getElementById('details').innerHTML = '';
        return;
    }

    const hadithNumbers = Array.from({length: sectionDetails.hadithnumber_last - sectionDetails.hadithnumber_first + 1}, (_, i) => i + sectionDetails.hadithnumber_first);
    if (hadithNumbers.length === 0) {
        document.getElementById('hadith').innerText = 'No Hadith numbers available.';
        document.getElementById('details').innerHTML = '';
        return;
    }

    const randomHadithNumber = hadithNumbers[Math.floor(Math.random() * hadithNumbers.length)];
    const hadithEndpoint = `editions/${randomEdition}/${randomHadithNumber}`;
    const hadithData = await fetchAPI(hadithEndpoint);

    if (hadithData.error) {
        document.getElementById('hadith').innerText = hadithData.error;
        document.getElementById('details').innerHTML = '';
        return;
    }

    document.getElementById('hadith').innerHTML = `
        <blockquote class="text-xl italic font-semibold text-gray-900 dark:text-white">
            <svg class="w-8 h-8 text-gray-400 dark:text-gray-600 mb-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 14">
                <path d="M6 0H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3H2a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3h-1a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Z"/>
            </svg>
            <p>${hadithData.english || 'Hadith text not available'}</p>
        </blockquote>
    `;

    document.getElementById('details').innerHTML = `
        <p><strong>Section:</strong> ${volumeData.sections[randomSectionKey]}</p>
        <p><strong>Hadith Number:</strong> ${randomHadithNumber}</p>
    `;
}
