const botui = BotUI('botui-app');

// Load local data
let localData = {};
fetch('js/data.json')
    .then(response => response.json())
    .then(data => { localData = data; })
    .catch(error => console.error('Error loading local data:', error));

// Welcome message with iTeleDoc branding
botui.message.add({
    content: 'Welcome to iTeleDoc! I’m here to assist with information on our telemedicine services or general medical queries. Remember, I’m not a doctor—consult a professional for advice.'
}).then(showInput);

function showInput() {
    botui.action.text({
        action: { placeholder: 'Ask about services, symptoms, or diseases (e.g., "What are iTeleDoc services?" or "Symptoms of diabetes")' }
    }).then(res => {
        const query = res.value.toLowerCase();
        botui.message.add({ content: 'Searching...', loading: true }).then(msg => {
            if (query.includes('iteledoc') || query.includes('services') || query.includes('about') || query.includes('mission') || query.includes('vision')) {
                searchLocal(query, msg);
            } else {
                searchPubMed(query, msg);
            }
        });
    });
}

function searchLocal(query, loadingMsg) {
    let response = 'Here’s what I found from iTeleDoc:';
    
    if (query.includes('about')) {
        response += `\n\n${localData.about}`;
    } else if (query.includes('journey') || query.includes('approach') || query.includes('commitment') || query.includes('mission') || query.includes('vision')) {
        response += `\n\nJourney: ${localData.journey.approach}\nCommitment: ${localData.journey.commitment}\nMission: ${localData.journey.mission}\nVision: ${localData.journey.vision}`;
    } else if (query.includes('services')) {
        response += '\n\nOur Services:\n' + localData.services.map(s => `- **${s.name}**: ${s.desc}`).join('\n');
    } else {
        response = 'Sorry, no matching iTeleDoc info. Try asking about "services" or a medical topic.';
    }
    
    botui.message.update(loadingMsg, { content: response });
    showInput();
}

async function searchPubMed(query, loadingMsg) {
    const apiKey = '871bde46c0b1b3adc0186060d3e987742808';
    const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
    const searchUrl = `${baseUrl}esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=1&retmode=json&api_key=${apiKey}`;

    try {
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        const id = searchData.esearchresult.idlist[0];

        if (!id) {
            botui.message.update(loadingMsg, { content: 'No PubMed results. Checking iTeleDoc info...' });
            searchLocal(query, loadingMsg); // Fallback to local
            return;
        }

        const fetchUrl = `${baseUrl}esummary.fcgi?db=pubmed&id=${id}&retmode=json&api_key=${apiKey}`;
        const fetchRes = await fetch(fetchUrl);
        const fetchData = await fetchRes.json();
        const title = fetchData.result[id].title;

        botui.message.update(loadingMsg, {
            content: `From PubMed: "${title}". For more, consult a healthcare provider. Want another question?`
        });
        showInput();
    } catch (error) {
        botui.message.update(loadingMsg, { content: 'Error fetching PubMed data. Trying local search...' });
        searchLocal(query, loadingMsg);
    }
}