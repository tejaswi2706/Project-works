let matchData = {
    team1: "",
    team2: "",
    tossWinner: "",
    tossDecision: "",
    battingTeam: "",
    bowlingTeam: "",
    innings: 1,
    totalOvers: 2,
    currentOver: 0,
    currentBall: 0,
    totalRuns: 0,
    totalWickets: 0,
    batsmen: [],
    bowlers: [],
    currentStriker: null,
    currentNonStriker: null,
    currentBowler: null,
    extras: {
        wides: 0,
        noballs: 0,
        byes: 0,
        legbyes: 0
    },
    commentary: [],
    firstInningsScore: 0,
    firstInningsWickets: 0,
    firstInningsOvers: 0
};

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('startMatch')) {
        document.getElementById('startMatch').addEventListener('click', startMatch);
    }
    if (document.getElementById('livePage')) {
        initializeLivePage();
    }
    
    if (document.getElementById('scorecardPage')) {
        initializeScorecardPage();
    }
    
    if (document.getElementById('summaryPage')) {
        initializeSummaryPage();
    }
});

function startMatch() {
    matchData.team1 = document.getElementById('team1').value;
    matchData.team2 = document.getElementById('team2').value;
    matchData.tossWinner = document.getElementById('tossWinner').value;
    matchData.tossDecision = document.getElementById('tossDecision').value;
    if(matchData.team1==="" || matchData.team2===""){
        alert("Please enter teams name")
    }
    else if(matchData.tossWinner===""){
        alert("Please select toss-winner!")
    }
    else if(matchData.tossDecision===""){
        alert("Please let us know the toss-decision!")
    }
    else{
    if (matchData.tossWinner === 'team1') {
        matchData.battingTeam = matchData.tossDecision === 'bat' ? matchData.team1 : matchData.team2;
        matchData.bowlingTeam = matchData.tossDecision === 'bat' ? matchData.team2 : matchData.team1;
    } else {
        matchData.battingTeam = matchData.tossDecision === 'bat' ? matchData.team2 : matchData.team1;
        matchData.bowlingTeam = matchData.tossDecision === 'bat' ? matchData.team1 : matchData.team2;
    }
    
    // Save data to localStorage (newly learnt by me!)
    localStorage.setItem('matchData', JSON.stringify(matchData));
    
    // Redirect to live page (newly learnt by me!)
    window.location.href = 'live.html';
}
}

function initializeLivePage() {
    // Load match data from localStorage (newly learnt by me!)
    const savedData = localStorage.getItem('matchData');
    if (savedData) {
        matchData = JSON.parse(savedData);
    }
    
    // Prompting
    if (matchData.currentStriker === null) {
        let striker = '';
        while (!striker.trim()) {
            striker = prompt(`Enter first batsman for ${matchData.battingTeam}:`);
        }
    
        let nonStriker = '';
        while (!nonStriker.trim()) {
            nonStriker = prompt(`Enter second batsman for ${matchData.battingTeam}:`);
        }
    
        let bowler = '';
        while (!bowler.trim()) {
            bowler = prompt(`Enter first bowler for ${matchData.bowlingTeam}:`);
        }
    
        matchData.currentStriker = {
            name: striker.trim(),
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            out: false
        };
    
        matchData.currentNonStriker = {
            name: nonStriker.trim(),
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            out: false
        };
    
        matchData.currentBowler = {
            name: bowler.trim(),
            overs: 0,
            balls: 0,
            maidens: 0,
            runs: 0,
            wickets: 0
        };
    
        // Add to batsmen and bowlers lists
        matchData.batsmen.push({ ...matchData.currentStriker });
        matchData.batsmen.push({ ...matchData.currentNonStriker });
        matchData.bowlers.push({ ...matchData.currentBowler });
    
        localStorage.setItem('matchData', JSON.stringify(matchData));
    }
    
    
    updateLiveDisplay();
    
    // Even listeners for runs wickets
    document.getElementById('runs0').addEventListener('click', () => addRuns(0));
    document.getElementById('runs1').addEventListener('click', () => addRuns(1));
    document.getElementById('runs2').addEventListener('click', () => addRuns(2));
    document.getElementById('runs3').addEventListener('click', () => addRuns(3));
    document.getElementById('runs4').addEventListener('click', () => addRuns(4));
    document.getElementById('runs6').addEventListener('click', () => addRuns(6));
    document.getElementById('wicket').addEventListener('click', addWicket);
    document.getElementById('goToScorecard').addEventListener('click', () => {
        window.location.href = 'scorecard.html';
    });
}

function addRuns(runs) {
    // Update batsman stats
    console.log('addRuns called with', runs);
    matchData.currentStriker.runs += runs;
    matchData.currentStriker.balls++;

    if (runs === 4) matchData.currentStriker.fours++;
    if (runs === 6) matchData.currentStriker.sixes++;

    // Update bowler stats
    matchData.currentBowler.runs += runs;
    matchData.currentBowler.balls++;  // <-- this was wrongly removed!

    // Update match stats
    matchData.totalRuns += runs;
    matchData.currentBall++;

    // Check for over completion
    if (matchData.currentBall === 6) {
        matchData.currentBall = 0;
        matchData.currentOver++;
        matchData.currentBowler.overs++;
        matchData.currentBowler.balls = 0; // Reset bowler's ball count for new over
        if (matchData.currentOverRuns === 0) {
            matchData.currentBowler.maidens += 1;
        }
        // Swap at the end of the over
        const temp = matchData.currentStriker;
        matchData.currentStriker = matchData.currentNonStriker;
        matchData.currentNonStriker = temp;

        // Prompt for new bowler after an over
        if (
            (matchData.innings === 1 && matchData.currentOver < matchData.totalOvers) ||
            (matchData.innings === 2 &&
             matchData.currentOver < matchData.totalOvers &&
             matchData.totalRuns <= matchData.firstInningsScore)
        ) {
            let newBowler = '';
            while (!newBowler.trim()) {
                newBowler = prompt(`Enter next bowler for ${matchData.bowlingTeam}:`);
            }
        
            matchData.currentBowler = {
                name: newBowler.trim(),
                overs: 0,
                balls: 0,
                maidens: 0,
                runs: 0,
                wickets: 0
            };
        
            matchData.bowlers.push({ ...matchData.currentBowler });
        }
        

        // Switch innings after 2 overs in first innings 
        if (matchData.currentOver === 2 && matchData.innings === 1) {
            switchInnings();
        }
        
    }

    // Swapping batters for odd runs
    if (runs % 2 !== 0) {
        const temp = matchData.currentStriker;
        matchData.currentStriker = matchData.currentNonStriker;
        matchData.currentNonStriker = temp;
    }

    // Commentary
    addCommentary(`${matchData.currentOver}.${matchData.currentBall} ${matchData.currentBowler.name} to ${matchData.currentStriker.name}, ${runs} run${runs !== 1 ? 's' : ''}`);

    checkInningsCompletion();
    syncBatsmen();
    syncBowler();
    // Save and update display
    localStorage.setItem('matchData', JSON.stringify(matchData));
    updateLiveDisplay();
}





function addWicket() {
    // Update batsman stats
    console.log("Hi")
    matchData.currentStriker.out = true;
    matchData.totalWickets++;
    matchData.currentBowler.wickets++;
    matchData.currentBowler.balls++;
    matchData.currentBall++;
    
    // Commentary
    addCommentary(`${matchData.currentOver}.${matchData.currentBall} ${matchData.currentBowler.name} to ${matchData.currentStriker.name}, OUT!`);
    
    // Check if all out or innings complete
    if (matchData.totalWickets === 10 || 
        (matchData.currentOver === matchData.totalOvers && matchData.currentBall === 6) ||
        (matchData.innings === 2 && matchData.totalRuns > matchData.firstInningsScore)) {
        checkInningsCompletion();
    } else {
        // Prompting for new batsman with validation
        let newBatsman = '';
        while (!newBatsman.trim()) {
            newBatsman = prompt(`Enter next batsman for ${matchData.battingTeam}:`);
        }
    
        matchData.currentStriker = {
            name: newBatsman.trim(),
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            out: false
        };
        matchData.batsmen.push({ ...matchData.currentStriker });
    }
    
    syncBatsmen();
    syncBowler();
    localStorage.setItem('matchData', JSON.stringify(matchData));
    updateLiveDisplay();
}

function checkInningsCompletion() {
    
    if (matchData.innings === 1) {
        if (matchData.currentOver === matchData.totalOvers && matchData.currentBall === 6) {
            
            matchData.firstInningsScore = matchData.totalRuns;
            matchData.firstInningsWickets = matchData.totalWickets;
            matchData.firstInningsOvers = matchData.currentOver + (matchData.currentBall / 10);
            switchInnings();
        } else if (matchData.totalWickets === 10) {
            
            matchData.firstInningsScore = matchData.totalRuns;
            matchData.firstInningsWickets = matchData.totalWickets;
            matchData.firstInningsOvers = matchData.currentOver + (matchData.currentBall / 10);
            
            switchInnings();
        }
    } else if (matchData.innings === 2) {
        if (matchData.totalRuns > matchData.firstInningsScore) {
            // Match complete - chasing team won
            endMatch();
        } else if (matchData.currentOver === matchData.totalOvers && matchData.currentBall === 6) {
            // Match complete - defending team won or tie
            endMatch();
        } else if (matchData.totalWickets === 10) {
            // All out
            endMatch();
        }
    }
    localStorage.setItem('matchData', JSON.stringify(matchData));
}

function switchInnings() {
    // Store first innings score BEFORE resetting
    matchData.firstInningsScore = matchData.totalRuns;
    matchData.firstInningsWickets = matchData.totalWickets;
    matchData.firstInningsOvers = matchData.currentOver + (matchData.currentBall / 6);

    matchData.innings = 2;
    matchData.currentOver = 0;
    matchData.currentBall = 0;
    matchData.totalRuns = 0;
    matchData.totalWickets = 0;

    // Swap batting and bowling teams
    const temp = matchData.battingTeam;
    matchData.battingTeam = matchData.bowlingTeam;
    matchData.bowlingTeam = temp;

    // batsmen and bowlers for new innings
    let striker = '';
while (!striker.trim()) {
    striker = prompt(`Enter first batsman for ${matchData.battingTeam}:`);
}

let nonStriker = '';
while (!nonStriker.trim()) {
    nonStriker = prompt(`Enter second batsman for ${matchData.battingTeam}:`);
}

let bowler = '';
while (!bowler.trim()) {
    bowler = prompt(`Enter first bowler for ${matchData.bowlingTeam}:`);
}

matchData.currentStriker = {
    name: striker.trim(),
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    out: false
};

matchData.currentNonStriker = {
    name: nonStriker.trim(),
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    out: false
};

matchData.currentBowler = {
    name: bowler.trim(),
    overs: 0,
    balls: 0,
    maidens: 0,
    runs: 0,
    wickets: 0
};

    // Save first-innings state so that you can use in scorecard
matchData.firstInningsBatsmen = matchData.batsmen. map(b => ({ ...b }));
matchData.firstInningsBowlers  = matchData.bowlers .map(b => ({ ...b }));

// reset for second innings
matchData.batsmen = [
  { ...matchData.currentStriker },
  { ...matchData.currentNonStriker }
];
matchData.bowlers = [
  { ...matchData.currentBowler }    
];


    addCommentary(`Innings break. ${matchData.bowlingTeam} need ${matchData.firstInningsScore + 1} runs to win.`);

    localStorage.setItem('matchData', JSON.stringify(matchData));
    updateLiveDisplay();
}
// Sync the two “live” batsmen back into the batsmen array
function syncBatsmen() {
    matchData.batsmen = matchData.batsmen.map(b => {
      if (b.name === matchData.currentStriker.name) {
        return { ...matchData.currentStriker };
      }
      if (b.name === matchData.currentNonStriker.name) {
        return { ...matchData.currentNonStriker };
      }
      return b;
    });
  }
  
  // Sync the current bowler back into the bowlers array
  function syncBowler() {
    matchData.bowlers = matchData.bowlers.map(b => {
      if (b.name === matchData.currentBowler.name) {
        return { ...matchData.currentBowler };
      }
      return b;
    });
  }
  


function endMatch() {
    // Save final data
    localStorage.setItem('matchData', JSON.stringify(matchData));
    
    // Redirect to summary page
    window.location.href = 'summary.html';
}

function addCommentary(text) {
    matchData.commentary.push(text);
    localStorage.setItem('matchData', JSON.stringify(matchData));
}

function updateLiveDisplay() {
    // Update match summary
    if (matchData.innings === 1) {
        document.getElementById('matchSummary').textContent = 
            `${matchData.battingTeam} ${matchData.totalRuns}/${matchData.totalWickets} (${matchData.currentOver}.${matchData.currentBall}) vs ${matchData.bowlingTeam}`;
    } else {
        document.getElementById('matchSummary').textContent = 
            `${matchData.battingTeam} ${matchData.totalRuns}/${matchData.totalWickets} (${matchData.currentOver}.${matchData.currentBall}) vs ${matchData.bowlingTeam} ${matchData.firstInningsScore}/${matchData.firstInningsWickets} (${matchData.firstInningsOvers.toFixed(1)})`;
    }
    
    // Update batsmen table
    updateBatsmenTable();
    
    // Update bowler info
    updateBowlerInfo();
    
    // Updating required run rate if in second innings
    if (matchData.innings === 2) {
        const ballsRemaining = (matchData.totalOvers * 6) - (matchData.currentOver * 6 + matchData.currentBall);
        const runsNeeded = matchData.firstInningsScore - matchData.totalRuns + 1;
        if(ballsRemaining>0){
        document.getElementById('rrr').textContent = 
            `RRR: ${(runsNeeded / (ballsRemaining / 6)).toFixed(2)}`;
        }
        else{
            document.getElementById('rrr').textContent = '';
    endMatch();
        }
    }
    localStorage.setItem('matchData', JSON.stringify(matchData));
}

function updateBatsmenTable() {
    const strikerRow = document.getElementById('strikerRow');
    const nonStrikerRow = document.getElementById('nonStrikerRow');
    
    // Update strikeBatter row
    strikerRow.cells[0].textContent = matchData.currentStriker.name;
    strikerRow.cells[1].textContent = matchData.currentStriker.runs;
    strikerRow.cells[2].textContent = matchData.currentStriker.balls;
    strikerRow.cells[3].textContent = matchData.currentStriker.fours;
    strikerRow.cells[4].textContent = matchData.currentStriker.sixes;
    strikerRow.cells[5].textContent = matchData.currentStriker.balls > 0 
        ? ((matchData.currentStriker.runs / matchData.currentStriker.balls) * 100).toFixed(2)
        : '0.00';
    
    // Update non-strikeBatter row
    nonStrikerRow.cells[0].textContent = matchData.currentNonStriker.name;
    nonStrikerRow.cells[1].textContent = matchData.currentNonStriker.runs;
    nonStrikerRow.cells[2].textContent = matchData.currentNonStriker.balls;
    nonStrikerRow.cells[3].textContent = matchData.currentNonStriker.fours;
    nonStrikerRow.cells[4].textContent = matchData.currentNonStriker.sixes;
    nonStrikerRow.cells[5].textContent = matchData.currentNonStriker.balls > 0 
        ? ((matchData.currentNonStriker.runs / matchData.currentNonStriker.balls) * 100).toFixed(2)
        : '0.00';
}

function updateBowlerInfo() {
    const bowlerInfo = document.getElementById('bowlerInfo');
    
    bowlerInfo.querySelector('.bowler-name').textContent = matchData.currentBowler.name;
    bowlerInfo.querySelector('.overs').textContent = `${matchData.currentBowler.overs}.${matchData.currentBowler.balls}`;
    bowlerInfo.querySelector('.maidens').textContent = matchData.currentBowler.maidens;
    bowlerInfo.querySelector('.runs').textContent = matchData.currentBowler.runs;
    bowlerInfo.querySelector('.wickets').textContent = matchData.currentBowler.wickets;
    
    const totalBalls = matchData.currentBowler.overs * 6 + matchData.currentBowler.balls;
    bowlerInfo.querySelector('.economy').textContent = totalBalls > 0 
        ? (matchData.currentBowler.runs / (totalBalls / 6)).toFixed(2)
        : '0.00';
}

function initializeScorecardPage() {
    // Load match data
    console.log("💡 initializeScorecardPage called", matchData);

    const savedData = localStorage.getItem('matchData');
    if (savedData) {
        matchData = JSON.parse(savedData);
    }
    console.log("💡 initializeScorecardPage called", matchData);
    // Update scorecard display
    updateScorecardDisplay();
    
    // Add event listener for back button
    document.getElementById('backToLive').addEventListener('click', () => {
        window.location.href = 'live.html';
    });
}

function updateScorecardDisplay() {
    console.log("📋 Updating Scorecard Display");

    // Clear all sections
    document.getElementById('firstInningsbat').innerHTML = '';
    document.getElementById('firstInningsball').innerHTML = '';
    document.getElementById('secondInningsbat').innerHTML = '';
    document.getElementById('secondInningsball').innerHTML = '';

    // Helper function to create batting row
    const createBattingRow = batsman => `
        <tr>
            <td>${batsman.name}</td>
            <td>${batsman.runs}</td>
            <td>${batsman.balls}</td>
            <td>${batsman.fours}</td>
            <td>${batsman.sixes}</td>
            <td>${batsman.balls > 0 ? ((batsman.runs / batsman.balls) * 100).toFixed(2) : '0.00'}</td>
        </tr>
    `;

    // Helper function to create bowling row
    const createBowlingRow = bowler => {
        const totalBalls = bowler.overs * 6 + bowler.balls;
        return `
        <tr>
            <td>${bowler.name}</td>
            <td>${bowler.overs}.${bowler.balls}</td>
            <td>${bowler.maidens}</td>
            <td>${bowler.runs}</td>
            <td>${bowler.wickets}</td>
            <td>${totalBalls > 0 ? (bowler.runs / (totalBalls / 6)).toFixed(2) : '0.00'}</td>
        </tr>`;
    };

    if (matchData.innings === 1) {
        matchData.batsmen.forEach(batsman => {
            document.getElementById('firstInningsbat').innerHTML += createBattingRow(batsman);
        });

        matchData.bowlers.forEach(bowler => {
            document.getElementById('firstInningsball').innerHTML += createBowlingRow(bowler);
        });
    }

    // Populate second innings (only if second innings has started or finished)
    if (matchData.innings === 2 || matchData.secondInningsCompleted) {
        matchData.batsmen.forEach(batsman => {
            document.getElementById('secondInningsbat').innerHTML += createBattingRow(batsman);
        });

        matchData.bowlers.forEach(bowler => {
            document.getElementById('secondInningsball').innerHTML += createBowlingRow(bowler);
        });
        matchData.firstInningsBatsmen.forEach(batsman => {
            document.getElementById('firstInningsbat').innerHTML += createBattingRow(batsman);
        });

        matchData.firstInningsBowlers.forEach(bowler => {
            document.getElementById('firstInningsball').innerHTML += createBowlingRow(bowler);
     });

    }
}


function initializeSummaryPage() {
    // Load match data
    const savedData = localStorage.getItem('matchData');
    if (savedData) {
        matchData = JSON.parse(savedData);
    }
    
    // Determine result and display
    displayResult();
    document.getElementById('goToFScorecard').addEventListener('click', () => {
        window.location.href = 'scorecard.html';
    });

    // Add event listener for reset button
    document.getElementById('resetMatch').addEventListener('click', resetMatch);
}

function displayResult() {
    const resultDiv = document.getElementById('matchResult');
    
    if (matchData.innings === 2) {
        if (matchData.totalRuns > matchData.firstInningsScore) {
            // Chasing team won
            const ballsRemaining = (matchData.totalOvers * 6) - (matchData.currentOver * 6 + matchData.currentBall);
            const wicketsLeft = 10 - matchData.totalWickets;
            
            resultDiv.textContent = 
                `${matchData.battingTeam} wins by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''} (${ballsRemaining} ball${ballsRemaining !== 1 ? 's' : ''} remaining)!`;
        } else if (matchData.totalRuns === matchData.firstInningsScore) {
            // Tie
            resultDiv.textContent = "Match tied!";
        } else {
            // Defending team won
            const runsDifference = matchData.firstInningsScore - matchData.totalRuns;
            resultDiv.textContent = 
                `${matchData.bowlingTeam} wins by ${runsDifference} run${runsDifference !== 1 ? 's' : ''}!`;
        }
    }
}

function resetMatch() {
    // Clear localStorage
    localStorage.removeItem('matchData');
    
    // Redirect to setup page
    window.location.href = 'setup.html';
}
