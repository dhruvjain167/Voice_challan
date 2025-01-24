// export const parseVoiceInput = (voiceText) => {
//     const quantityMap = {
//         "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
//         "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
//         "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14,
//         "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19,
//         "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60,
//         "seventy": 70, "eighty": 80, "ninety": 90
//     };
//     const fractionMap = {"half": "1/2", "quarter": "1/4", "": "3/4"};

//     const wordToNumber = (word) => {
//         return quantityMap[word.toLowerCase()] || word;
//     };

//     const replaceFractions = (text) => {
//         for (const [fraction, value] of Object.entries(fractionMap)) {
//             text = text.replace(new RegExp(fraction, 'gi'), value);
//         }
//         return text;
//     };

//     const items = [];
//     // Split by comma to separate items
//     const itemsList = voiceText.split(",");

//     for (const item of itemsList) {
//         let processedItem = replaceFractions(item.trim());
//         const words = processedItem.split(" ");
        
//         try {
//             // Find the first number or number word
//             let quantity = null;
//             let descriptionStartIndex = 0;

//             for (let i = 0; i < words.length; i++) {
//                 const word = words[i].toLowerCase();
//                 const num = wordToNumber(word);
                
//                 if (!isNaN(num)) {
//                     quantity = parseInt(num);
//                     descriptionStartIndex = i + 1;
//                     break;
//                 }
//             }

//             if (quantity === null) continue; // Skip if no quantity found

//             // Get the description after the quantity
//             const description = words.slice(descriptionStartIndex)
//                 .join(" ")
//                 .replace(/M M/g, "mm")
//                 .replace(/Intu/g, "inch")
//                 .trim();

//             if (description) {
//                 items.push({ quantity, description });
//             }
//         } catch (error) {
//             console.error(`Could not parse item: '${item}'`, error);
//         }
//     }
    
//     return items;
// };

export const parseVoiceInput = (voiceText) => {
    const quantityMap = {
        "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
        "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
        "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14,
        "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19,
        "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60,
        "seventy": 70, "eighty": 80, "ninety": 90
    };
    const fractionMap = {"half": "1/2", "Sawaka": "1/4", "Pune ka": "3/4"};

    const wordToNumber = (word) => {
        return quantityMap[word.toLowerCase()] || word;
    };

    const replaceFractions = (text) => {
        for (const [fraction, value] of Object.entries(fractionMap)) {
            text = text.replace(new RegExp(fraction, 'gi'), value);
        }
        return text;
    };

    const items = [];
    const itemsList = voiceText.split(",");

    for (const item of itemsList) {
        let processedItem = replaceFractions(item.trim());
        const words = processedItem.split(" ");
        
        try {
            let quantity = null;
            let descriptionStartIndex = 0;

            for (let i = 0; i < words.length; i++) {
                const word = words[i].toLowerCase();
                const num = wordToNumber(word);
                
                if (!isNaN(num)) {
                    quantity = parseInt(num);
                    descriptionStartIndex = i + 1;
                    break;
                }
            }

            if (quantity === null) continue;

            const description = words.slice(descriptionStartIndex)
                .join(" ")
                .replace(/M M/g, "mm")
                .replace(/Intu/g, "inch")
                .trim();

            if (description) {
                items.push({ quantity, description });
            }
        } catch (error) {
            console.error(`Could not parse item: '${item}'`, error);
        }
    }
    
    return items;
};