(async () => {
    // --- UI Setup ---
    const scrapingMessage = document.createElement('div');
    scrapingMessage.id = 'scraping-in-progress-message';
    Object.assign(scrapingMessage.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        zIndex: '10001',
        fontSize: '16px'
    });
    scrapingMessage.innerHTML = 'Scraping data...<br>Scraped 0 rows.';
    document.body.appendChild(scrapingMessage);

    const cleanupUI = () => {
        if (document.getElementById('scraping-in-progress-message')) {
            document.getElementById('scraping-in-progress-message').remove();
        }
    };

    // --- Scraping Logic ---
    const delay = ms => new Promise(res => setTimeout(res, ms));

    try {
        const wantedHeaders = ["Campaign", "Starts", "Ends", "Tags", "Impressions", "Budget", "Amount spent"];
        const grid = document.querySelector('[role="table"]');
        if (!grid) throw new Error("Could not find the main data table.");

        let scrollContainer = grid.parentElement;
        while(scrollContainer && scrollContainer.scrollHeight <= scrollContainer.clientHeight && scrollContainer.tagName !== 'BODY') {
            scrollContainer = scrollContainer.parentElement;
        }
        if (!scrollContainer || scrollContainer.tagName === 'BODY') {
            scrollContainer = document.querySelector('div._7mkk') || window;
        }

        const allHeaderElements = Array.from(grid.querySelectorAll('[role="columnheader"]'));
        const allHeaderTexts = allHeaderElements.map(el => el.innerText.trim());
        const wantedHeaderInfo = wantedHeaders.map(wantedHeader => {
            const index = allHeaderTexts.findIndex(header => header.startsWith(wantedHeader));
            if (index === -1) throw new Error(`Could not find column: "${wantedHeader}"`);
            return { name: wantedHeader, index: index + 1 };
        });

        const allRowsData = [];
        const processedRowKeys = new Set();
        let consecutiveNoNewRows = 0;

        while (consecutiveNoNewRows < 3) {
            const currentScrollTop = scrollContainer.scrollTop || window.scrollY;
            const dataRowElements = Array.from(grid.querySelectorAll('._1gda'));
            if (dataRowElements.length === 0 && allRowsData.length === 0) throw new Error("Found table headers, but no data rows.");

            let newRowsFoundInThisPass = false;
            const getCellText = (cell, headerName) => {
                if (!cell) return "";
                let text = cell.innerText;
                if (headerName === "Amount spent" || headerName === "Budget") return text.replace(/[£,Â]/g, '').split('\n')[0].trim();
                if (headerName === "Ends") return text.split('\n')[0];
                return text.replace(/\n/g, ' ').trim();
            };

            for (const rowEl of dataRowElements) {
                const cellElements = Array.from(rowEl.querySelectorAll('._4lg0'));
                const campaignCell = cellElements[wantedHeaderInfo.find(h => h.name === 'Campaign').index];
                const startsCell = cellElements[wantedHeaderInfo.find(h => h.name === 'Starts').index];
                const rowKey = (campaignCell?.innerText || '') + '||' + (startsCell?.innerText || '');

                if (rowKey && !processedRowKeys.has(rowKey)) {
                    processedRowKeys.add(rowKey);
                    newRowsFoundInThisPass = true;
                    const rowData = {};
                    wantedHeaderInfo.forEach(info => {
                        const cell = cellElements[info.index];
                        rowData[info.name] = getCellText(cell, info.name);
                    });
                    allRowsData.push(rowData);
                }
            }

            scrapingMessage.innerHTML = `Scraping data...<br>Scraped ${allRowsData.length} rows.`;
            if (newRowsFoundInThisPass) consecutiveNoNewRows = 0; else consecutiveNoNewRows++;

            if (scrollContainer === window) window.scrollBy(0, window.innerHeight * 0.8);
            else scrollContainer.scrollBy(0, scrollContainer.clientHeight * 0.8);

            await delay(1000);
            if ((scrollContainer.scrollTop || window.scrollY) === currentScrollTop && !newRowsFoundInThisPass) break;
        }

        // --- XLSX Generation ---
        const worksheet = XLSX.utils.json_to_sheet(allRowsData, { header: wantedHeaders });
        const redFill = { fgColor: { rgb: "c54841" } };
        const tagsColIndex = wantedHeaders.indexOf("Tags");
        if (tagsColIndex !== -1) {
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                const cell_address = { c: tagsColIndex, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                const cell = worksheet[cell_ref];
                if (!cell || !cell.v || (typeof cell.v === 'string' && cell.v.trim() === '')) {
                    if (!worksheet[cell_ref]) worksheet[cell_ref] = { t: 's', v: '' };
                    worksheet[cell_ref].s = redFill;
                }
            }
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Meta Billing Data");
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = 'meta_billing_check.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (e) {
        console.error("Error during Meta Billing Check:", e);
        alert("An error occurred while scraping: " + e.message);
    } finally {
        cleanupUI();
    }
})();
