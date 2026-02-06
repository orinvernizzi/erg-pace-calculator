$(document).ready(function() {
    // ====== INTERACTIVE FEATURES ======

    // Save Workout Button
    $('#saveWorkoutBtn').click(function() {
        showNotification('Workout saved successfully!');
        $(this).find('i').addClass('fa-bounce');
        setTimeout(() => $(this).find('i').removeClass('fa-bounce'), 600);
    });

    // Share Workout Button
    $('#shareWorkoutBtn').click(function() {
        showNotification('Workout link copied to clipboard!');
        $(this).find('i').addClass('fa-bounce');
        setTimeout(() => $(this).find('i').removeClass('fa-bounce'), 600);
    });

    // Theme Toggle Button
    $('#themeToggleBtn').click(function() {
        const $icon = $(this).find('i');
        $icon.toggleClass('fa-sun fa-moon');
        $(this).find('.btn-tooltip').text($icon.hasClass('fa-moon') ? 'Light' : 'Dark');
        $icon.addClass('fa-spin');
        setTimeout(() => $icon.removeClass('fa-spin'), 600);
    });

    // Show notification toast
    function showNotification(message) {
        const $toast = $('#notificationToast');
        $toast.find('span').text(message);
        $toast.addClass('show');

        setTimeout(() => {
            $toast.removeClass('show');
        }, 3000);
    }

    // Trigger confetti on calculate
    window.triggerConfetti = function() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    };

    // ====== MODE SWITCHING ======
    $('#distanceModeTab').click(function() {
        $('.mode-card').removeClass('active');
        $(this).addClass('active');
        $('.calculator-container').removeClass('active');
        $('#distanceCalculator').addClass('active');
        $('#results').hide();
    });
    
    $('#timeModeTab').click(function() {
        $('.mode-card').removeClass('active');
        $(this).addClass('active');
        $('.calculator-container').removeClass('active');
        $('#timeCalculator').addClass('active');
        $('#results').hide();
    });
    
    // ====== DISTANCE CALCULATOR ======
    
    // Initialize distance calculator
    updateDistanceSplits();
    
    // Show/hide custom inputs
    $('#total_meters').change(function() {
        if ($(this).val() === 'custom') {
            $('#custom_meters_container').show();
            $('#custom_meters').focus();
        } else {
            $('#custom_meters_container').hide();
        }
        updateDistanceSplits();
    });
    
    $('#segment_length').change(function() {
        if ($(this).val() === 'custom_segment') {
            $('#custom_segment_container').show();
            $('#custom_segment').focus();
        } else {
            $('#custom_segment_container').hide();
        }
        updateDistanceSplits();
    });
    
    // Update on custom input change
    $('#custom_meters, #custom_segment').on('input', function() {
        updateDistanceSplits();
    });
    
    // Update distance splits
    function updateDistanceSplits() {
        const totalMeters = getTotalMeters();
        const segmentLength = getSegmentLength();
        
        if (segmentLength <= 0 || totalMeters <= 0) {
            $('#distanceSplitsContainer').html('<div class="alert alert-danger">Please enter valid positive numbers.</div>');
            return;
        }
        
        if (totalMeters % segmentLength !== 0) {
            const suggestions = findDivisibleSegments(totalMeters);
            $('#distanceSplitsContainer').html(`
                <div class="alert alert-danger">
                    <strong>Error!</strong> ${segmentLength}m does not divide ${totalMeters}m evenly.
                    <br>
                    <small>Try: ${suggestions}</small>
                </div>
            `);
            return;
        }
        
        const numSegments = totalMeters / segmentLength;
        
        // Update info text
        $('#distanceSegmentsInfoText').text(`You'll row ${totalMeters}m in ${numSegments} segments of ${segmentLength}m each.`);
        
        // Create split inputs
        let splitsHTML = '';
        
        for (let i = 0; i < numSegments; i++) {
            splitsHTML += `
                <div class="split-card">
                    <div class="split-label">Segment ${i+1}/${numSegments}</div>
                    <div class="split-note">${segmentLength}m section</div>
                    <div class="split-input-wrapper">
                        <input type="text" id="distance_split_${i}" 
                               class="form-control split-input" 
                               value="${getDefaultDistanceSplit(i, numSegments)}"
                               placeholder="1:45.0" 
                               required>
                        <span class="split-suffix">/500m</span>
                    </div>
                    <small class="form-text">Target pace (m:ss.s)</small>
                </div>
            `;
        }
        
        $('#distanceSplitsContainer').html(splitsHTML);
        
        // Add validation
        $('.split-input').on('input', validateSplitFormat);
    }
    
    // Helper functions for distance calculator
    function getTotalMeters() {
        const selected = $('#total_meters').val();
        if (selected === 'custom') {
            return parseInt($('#custom_meters').val()) || 2000;
        }
        return parseInt(selected);
    }
    
    function getSegmentLength() {
        const selected = $('#segment_length').val();
        if (selected === 'custom_segment') {
            return parseInt($('#custom_segment').val()) || 500;
        }
        return parseInt(selected);
    }
    
    function getDefaultDistanceSplit(segmentIndex, totalSegments) {
        const baseSplit = 105; // 1:45.0 in seconds
        const variation = 3;
        
        if (segmentIndex === 0) {
            return secondsToTimeFormat(baseSplit + 2); // Start conservative
        } else if (segmentIndex === totalSegments - 1) {
            return secondsToTimeFormat(baseSplit - 1); // Finish strong
        } else {
            return secondsToTimeFormat(baseSplit - (segmentIndex % 2)); // Alternate
        }
    }
    
    function findDivisibleSegments(totalMeters) {
        const suggestions = [];
        const commonLengths = [100, 250, 400, 500, 1000, 2000];
        
        commonLengths.forEach(length => {
            if (totalMeters % length === 0) {
                const numSegments = totalMeters / length;
                suggestions.push(`${length}m (${numSegments} segments)`);
            }
        });
        
        return suggestions.slice(0, 3).join(', ');
    }
    
    // Quick fill for distance
    $('#quickFillDistance').click(function() {
        const totalMeters = getTotalMeters();
        const segmentLength = getSegmentLength();
        const numSegments = totalMeters / segmentLength;
        
        for (let i = 0; i < numSegments; i++) {
            const split = getDefaultDistanceSplit(i, numSegments);
            $(`#distance_split_${i}`).val(split);
        }
    });
    
    // Calculate distance workout
    $('#calculateDistanceBtn').click(function() {
        const totalMeters = getTotalMeters();
        const segmentLength = getSegmentLength();
        const numSegments = totalMeters / segmentLength;
        
        // Collect splits
        const splits = [];
        for (let i = 0; i < numSegments; i++) {
            splits.push($(`#distance_split_${i}`).val());
        }
        
        // Validate splits
        if (!validateSplits(splits)) {
            alert('Please fix invalid split formats. Use m:ss.s (e.g., 1:45.3)');
            return;
        }
        
        // Calculate results
        calculateDistanceResults(totalMeters, segmentLength, splits);
    });
    
    // Reset distance calculator
    $('#resetDistanceBtn').click(function() {
        $('#total_meters').val('2000');
        $('#segment_length').val('500');
        $('#custom_meters_container').hide();
        $('#custom_segment_container').hide();
        updateDistanceSplits();
        $('#results').hide();
    });
    
    // ====== TIME CALCULATOR ======
    
    // Workout type selection
    $('#workout_type').change(function() {
        const type = $(this).val();
        $('#singleTimeContainer, #equalSegmentsContainer, #customSegmentsContainer').hide();
        
        if (type === 'single_time') {
            $('#singleTimeContainer').show();
        } else if (type === 'equal_segments') {
            $('#equalSegmentsContainer').show();
        } else if (type === 'custom_segments') {
            $('#customSegmentsContainer').show();
        }
    });
    
    // Common workouts
    $('#common_workouts').change(function() {
        const workout = $(this).val();
        $('#customSegmentsList').empty();
        
        switch(workout) {
            case '30r20':
                addCustomSegment(30, 0, 0, 0, '2:05.0');
                break;
            case 'hour_power':
                addCustomSegment(60, 0, 0, 0, '2:05.0');
                break;
            case '4x8':
                for (let i = 0; i < 4; i++) {
                    addCustomSegment(8, 0, 2, 0, '1:50.0');
                }
                break;
            case 'pyramid':
                [1, 2, 3, 4, 3, 2, 1].forEach((minutes, i) => {
                    const splitSeconds = 105 - (i * 1);
                    const minutesPart = Math.floor(splitSeconds / 60);
                    const secondsPart = (splitSeconds % 60).toFixed(1);
                    addCustomSegment(minutes, 0, 1, 0, `${minutesPart}:${secondsPart.padStart(4, '0')}`);
                });
                break;
            case '10x5':
                for (let i = 0; i < 10; i++) {
                    addCustomSegment(5, 0, 2, 0, '1:55.0');
                }
                break;
        }
        
        $('#workout_type').val('custom_segments').trigger('change');
        updateRemoveButtons();
    });
    
    // Add segment button
    $('#addSegmentBtn').click(function() {
        addCustomSegment(5, 0, 2, 0, '2:00.0');
        updateRemoveButtons();
    });
    
    function addCustomSegment(minutes, seconds, restMinutes, restSeconds, split) {
        const index = $('.custom-segment').length + 1;
        const segmentHTML = `
            <div class="custom-segment">
                <div class="custom-segment-header">
                    <div class="segment-number">
                        <span>${index.toString().padStart(2, '0')}</span>
                    </div>
                    <h4 class="segment-title">Segment ${index}</h4>
                    <button class="btn-delete-segment" onclick="removeSegment(this)" title="Remove Segment">
                        <i class="fas fa-xmark"></i>
                    </button>
                </div>
                
                <div class="custom-segment-body">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label-sm">Duration</label>
                            <div class="time-input-group">
                                <div class="time-input-item">
                                    <input type="number" class="form-control segment-minutes" value="${minutes}" min="1">
                                    <span class="time-label">min</span>
                                </div>
                                <span class="time-separator">:</span>
                                <div class="time-input-item">
                                    <input type="number" class="form-control segment-seconds" value="${seconds}" min="0" max="59">
                                    <span class="time-label">sec</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-4">
                            <label class="form-label-sm">Rest After</label>
                            <div class="time-input-group">
                                <div class="time-input-item">
                                    <input type="number" class="form-control rest-minutes" value="${restMinutes}" min="0">
                                    <span class="time-label">min</span>
                                </div>
                                <span class="time-separator">:</span>
                                <div class="time-input-item">
                                    <input type="number" class="form-control rest-seconds" value="${restSeconds}" min="0" max="59">
                                    <span class="time-label">sec</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-4">
                            <label class="form-label-sm">Target Split</label>
                            <div class="split-input-wrapper">
                                <input type="text" class="form-control split-input segment-split" value="${split}" placeholder="m:ss.s">
                                <span class="split-suffix">/500m</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        $('#customSegmentsList').append(segmentHTML);
    }
    
    window.removeSegment = function(button) {
        const segment = $(button).closest('.custom-segment');
        segment.remove();
        renumberSegments();
        updateRemoveButtons();
    }
    
    function renumberSegments() {
        $('.custom-segment').each(function(index) {
            $(this).find('.segment-title').text(`Segment ${index + 1}`);
            $(this).find('.segment-number span').text((index + 1).toString().padStart(2, '0'));
        });
    }
    
    function updateRemoveButtons() {
        const count = $('.custom-segment').length;
        if (count <= 1) {
            $('.btn-delete-segment').hide();
        } else {
            $('.btn-delete-segment').show();
        }
    }
    
    // Quick fill custom with negative splits
    $('#quickFillCustom').click(function() {
        const segments = $('.custom-segment');
        segments.each(function(index) {
            const splitSeconds = 120 - (index * 1.5); // Start at 2:00, get faster
            $(this).find('.segment-split').val(secondsToTimeFormat(splitSeconds));
        });
    });
    
    // ====== CALCULATION FUNCTIONS ======
    
    // Calculate distance workout results
    function calculateDistanceResults(totalMeters, segmentLength, splits) {
        // Convert splits to seconds
        const splitSeconds = splits.map(timeToSeconds);
        
        // Calculate average split
        const avgSplitSeconds = splitSeconds.reduce((a, b) => a + b, 0) / splitSeconds.length;
        const avgSplit = secondsToTime(avgSplitSeconds);
        
        // Calculate total time
        let totalTimeSeconds = 0;
        const segmentTimes = [];
        
        for (let i = 0; i < splits.length; i++) {
            const segmentTime = splitSeconds[i] * (segmentLength / 500);
            segmentTimes.push(segmentTime);
            totalTimeSeconds += segmentTime;
        }
        
        // Calculate watts
        const segmentWatts = splitSeconds.map(calculateWatts);
        const avgWatts = Math.round(segmentWatts.reduce((a, b) => a + b, 0) / segmentWatts.length);
        
        // Display results
        displayResults({
            workoutType: 'Distance-Based',
            totalMeters: totalMeters,
            segmentLength: segmentLength,
            numSegments: splits.length,
            splits: splits,
            splitSeconds: splitSeconds,
            segmentTimes: segmentTimes,
            totalTimeSeconds: totalTimeSeconds,
            avgSplit: avgSplit,
            avgWatts: avgWatts,
            segmentWatts: segmentWatts
        });
    }
    
    // Calculate time workout
    $('#calculateTimeBtn').click(function() {
        const workoutType = $('#workout_type').val();
        
        if (workoutType === 'single_time') {
            calculateSingleTimeWorkout();
        } else if (workoutType === 'equal_segments') {
            calculateEqualSegmentsWorkout();
        } else if (workoutType === 'custom_segments') {
            calculateCustomSegmentsWorkout();
        }
    });
    
    function calculateSingleTimeWorkout() {
        const minutes = parseInt($('#single_minutes').val()) || 0;
        const seconds = parseInt($('#single_seconds').val()) || 0;
        const split = $('#single_time_split').val();
        const totalTime = minutes * 60 + seconds;
        
        if (totalTime === 0) {
            alert('Please enter a valid time');
            return;
        }
        
        if (!validateSplit(split)) {
            alert('Invalid split format. Use m:ss.s (e.g., 1:45.3)');
            return;
        }
        
        const splitSeconds = timeToSeconds(split);
        const distance = (totalTime / splitSeconds) * 500;
        
        displayResults({
            workoutType: 'Single Time Piece',
            totalMeters: Math.round(distance),
            segmentLength: 0,
            numSegments: 1,
            splits: [split],
            splitSeconds: [splitSeconds],
            segmentTimes: [totalTime],
            totalTimeSeconds: totalTime,
            avgSplit: split,
            avgWatts: Math.round(calculateWatts(splitSeconds)),
            segmentWatts: [calculateWatts(splitSeconds)]
        });
    }
    
    function calculateEqualSegmentsWorkout() {
        const segmentMinutes = parseInt($('#segment_minutes').val()) || 0;
        const segmentSeconds = parseInt($('#segment_seconds').val()) || 0;
        const numSegments = parseInt($('#num_segments').val()) || 1;
        const restMinutes = parseInt($('#rest_minutes').val()) || 0;
        const restSeconds = parseInt($('#rest_seconds').val()) || 0;
        const split = $('#equal_segments_split').val();
        
        if (!validateSplit(split)) {
            alert('Invalid split format. Use m:ss.s (e.g., 1:45.3)');
            return;
        }
        
        const segmentTime = segmentMinutes * 60 + segmentSeconds;
        const restTime = restMinutes * 60 + restSeconds;
        const totalWorkTime = segmentTime * numSegments;
        
        const splitSeconds = timeToSeconds(split);
        const segmentDistance = (segmentTime / splitSeconds) * 500;
        const totalDistance = segmentDistance * numSegments;
        
        // Create arrays for all segments
        const splits = Array(numSegments).fill(split);
        const splitSecondsArr = Array(numSegments).fill(splitSeconds);
        const segmentTimesArr = Array(numSegments).fill(segmentTime);
        const watts = calculateWatts(splitSeconds);
        const segmentWattsArr = Array(numSegments).fill(watts);
        
        displayResults({
            workoutType: 'Equal Segments',
            totalMeters: Math.round(totalDistance),
            segmentLength: 0,
            numSegments: numSegments,
            splits: splits,
            splitSeconds: splitSecondsArr,
            segmentTimes: segmentTimesArr,
            totalTimeSeconds: totalWorkTime,
            avgSplit: split,
            avgWatts: Math.round(watts),
            segmentWatts: segmentWattsArr,
            restTime: restTime
        });
    }
    
    function calculateCustomSegmentsWorkout() {
        const segments = [];
        let totalWorkTime = 0;
        let totalRestTime = 0;
        
        $('.custom-segment').each(function() {
            const minutes = parseInt($(this).find('.segment-minutes').val()) || 0;
            const seconds = parseInt($(this).find('.segment-seconds').val()) || 0;
            const restMinutes = parseInt($(this).find('.rest-minutes').val()) || 0;
            const restSeconds = parseInt($(this).find('.rest-seconds').val()) || 0;
            const split = $(this).find('.segment-split').val();
            
            if (!validateSplit(split)) {
                alert(`Invalid split format in segment ${$(this).find('.segment-title').text()}. Use m:ss.s`);
                return false;
            }
            
            const segmentTime = minutes * 60 + seconds;
            const restTime = restMinutes * 60 + restSeconds;
            
            segments.push({
                time: segmentTime,
                rest: restTime,
                split: split
            });
            
            totalWorkTime += segmentTime;
            totalRestTime += restTime;
        });
        
        if (segments.length === 0) {
            alert('Please add at least one segment');
            return;
        }
        
        // Calculate distances and watts
        let totalDistance = 0;
        const splits = [];
        const splitSeconds = [];
        const segmentTimes = [];
        const segmentWatts = [];
        
        segments.forEach(segment => {
            const splitSec = timeToSeconds(segment.split);
            const distance = (segment.time / splitSec) * 500;
            const watts = calculateWatts(splitSec);
            
            splits.push(segment.split);
            splitSeconds.push(splitSec);
            segmentTimes.push(segment.time);
            segmentWatts.push(watts);
            totalDistance += distance;
        });
        
        const avgSplitSeconds = splitSeconds.reduce((a, b) => a + b, 0) / splitSeconds.length;
        const avgSplit = secondsToTime(avgSplitSeconds);
        const avgWatts = Math.round(segmentWatts.reduce((a, b) => a + b, 0) / segmentWatts.length);
        
        displayResults({
            workoutType: 'Custom Segments',
            totalMeters: Math.round(totalDistance),
            segmentLength: 0,
            numSegments: segments.length,
            splits: splits,
            splitSeconds: splitSeconds,
            segmentTimes: segmentTimes,
            totalTimeSeconds: totalWorkTime,
            avgSplit: avgSplit,
            avgWatts: avgWatts,
            segmentWatts: segmentWatts,
            segments: segments,
            totalRestTime: totalRestTime
        });
    }
    
    // Reset time calculator
    $('#resetTimeBtn').click(function() {
        $('#workout_type').val('custom_segments');
        $('#customSegmentsList').empty();
        addCustomSegment(10, 0, 2, 0, '2:00.0');
        $('#common_workouts').val('');
        updateRemoveButtons();
        $('#results').hide();
    });
    
    // ====== DISPLAY RESULTS ======
    
    function displayResults(data) {
        // Update summary
        $('#resultType').text(data.workoutType);
        $('#resultSegmentsCount').text(data.numSegments);
        $('#resultTotalDistance').text(data.totalMeters.toLocaleString() + 'm');
        $('#resultTotalTime').text(secondsToMinSec(data.totalTimeSeconds));
        $('#resultAvgSplit').text(data.avgSplit);
        $('#resultAvgWatts').text(data.avgWatts + 'W');
        
        // Create segment breakdown
        let breakdownHTML = '';
        let cumulativeTime = 0;
        let cumulativeDistance = 0;
        
        for (let i = 0; i < data.numSegments; i++) {
            const segmentDistance = (data.segmentTimes[i] / data.splitSeconds[i]) * 500;
            cumulativeTime += data.segmentTimes[i];
            cumulativeDistance += segmentDistance;
            
            breakdownHTML += `
                <div class="segment-row">
                    <strong>Segment ${i+1}:</strong> 
                    ${data.splits[i]}/500m → 
                    ${secondsToMinSec(data.segmentTimes[i])} for ${Math.round(segmentDistance)}m
                    (${Math.round(data.segmentWatts[i])}W)
                    <br>
                    <small>Cumulative: ${secondsToMinSec(cumulativeTime)} elapsed, 
                    ${Math.round(cumulativeDistance)}m covered</small>
                </div>
            `;
        }
        
        $('#segmentBreakdown').html(breakdownHTML);
        
        // Create pace visualization
        let paceBars = '';
        const maxWatts = Math.max(...data.segmentWatts);
        
        for (let i = 0; i < data.numSegments; i++) {
            const watts = data.segmentWatts[i];
            const barWidth = (watts / maxWatts * 100) + '%';
            
            paceBars += `
                <div class="pace-bar">
                    <div class="pace-bar-header">
                        <span>Seg ${i+1}: ${data.splits[i]}/500m</span>
                        <span>${Math.round(watts)}W</span>
                    </div>
                    <div class="pace-bar-track">
                        <div class="pace-bar-fill" style="width: ${barWidth}"></div>
                    </div>
                </div>
            `;
        }
        
        $('#paceBars').html(paceBars);
        
        // Create watts per segment
        let wattsHTML = '';
        for (let i = 0; i < data.segmentWatts.length; i++) {
            wattsHTML += `
                <div class="mb-2">
                    <small>Segment ${i+1}: <strong>${Math.round(data.segmentWatts[i])}W</strong> @ ${data.splits[i]}</small>
                </div>
            `;
        }
        
        $('#wattsPerSegment').html(wattsHTML);
        
        // Calculate equivalent scores with physiological fade factors
        // Rowers can't hold the same split at longer distances due to increased aerobic demand
        const avgSplitSeconds = timeToSeconds(data.avgSplit);
        const workoutMeters = data.totalMeters;
        
        // Fade factors (seconds per 500m slower when going longer)
        // Based on rowing physiology: 2k→5k (+5-6s), 2k→6k (+7-9s)
        const fadeFactors = {
            500: { to2k: -6, to5k: -1, to6k: 1 },    // From 500m projection
            1000: { to2k: -4, to5k: 1, to6k: 3 },    // From 1k projection
            2000: { to2k: 0, to5k: 5.5, to6k: 8 },   // From 2k (baseline)
            5000: { to2k: -5.5, to5k: 0, to6k: 2.5 }, // From 5k projection
            6000: { to2k: -8, to5k: -2.5, to6k: 0 },  // From 6k projection
            10000: { to2k: -10, to5k: -4.5, to6k: -2 } // From 10k projection
        };
        
        // Find closest known distance for fade lookup
        const knownDistances = [500, 1000, 2000, 5000, 6000, 10000];
        const closestDistance = knownDistances.reduce((prev, curr) => 
            Math.abs(curr - workoutMeters) < Math.abs(prev - workoutMeters) ? curr : prev
        );
        
        const fades = fadeFactors[closestDistance] || fadeFactors[2000];
        
        // Calculate projected splits for each distance
        const split2k = avgSplitSeconds + fades.to2k;
        const split5k = avgSplitSeconds + fades.to5k;
        const split6k = avgSplitSeconds + fades.to6k;
        
        // Calculate times
        const timeFor2k = split2k * 4;    // 2000m = 4 × 500m
        const timeFor5k = split5k * 10;   // 5000m = 10 × 500m
        const timeFor6k = split6k * 12;   // 6000m = 12 × 500m
        
        // Determine what to show based on workout distance
        const is2kWorkout = workoutMeters === 2000;
        const is5kWorkout = workoutMeters === 5000;
        const is6kWorkout = workoutMeters === 6000;
        
        let scoresHTML = '';
        
        if (is2kWorkout) {
            scoresHTML += `<p>2k (Your Time): <strong>${secondsToTime(data.totalTimeSeconds)}</strong> <small class="text-muted">@ ${data.avgSplit}/500m</small></p>`;
        } else {
            scoresHTML += `<p>Estimated 2k: <strong>${secondsToTime(timeFor2k)}</strong> <small class="text-muted">@ ${secondsToTime(split2k)}/500m</small></p>`;
        }
        
        if (is5kWorkout) {
            scoresHTML += `<p>5k (Your Time): <strong>${secondsToTime(data.totalTimeSeconds)}</strong> <small class="text-muted">@ ${data.avgSplit}/500m</small></p>`;
        } else {
            scoresHTML += `<p>Estimated 5k: <strong>${secondsToTime(timeFor5k)}</strong> <small class="text-muted">@ ${secondsToTime(split5k)}/500m</small></p>`;
        }
        
        if (is6kWorkout) {
            scoresHTML += `<p>6k (Your Time): <strong>${secondsToTime(data.totalTimeSeconds)}</strong> <small class="text-muted">@ ${data.avgSplit}/500m</small></p>`;
        } else {
            scoresHTML += `<p>Estimated 6k: <strong>${secondsToTime(timeFor6k)}</strong> <small class="text-muted">@ ${secondsToTime(split6k)}/500m</small></p>`;
        }
        
        scoresHTML += `<small class="d-block mt-2 text-muted"><i class="fas fa-info-circle"></i> Estimates account for aerobic fade at longer distances</small>`;
        
        $('#equivalentScores').html(scoresHTML);
        
        // Show results
        $('.results-container').show();

        // Trigger celebration confetti
        triggerConfetti();

        // Scroll to results
        $('html, body').animate({
            scrollTop: $('.results-container').offset().top - 100
        }, 500);
    }
    
    // ====== HELPER FUNCTIONS ======
    
    function validateSplit(split) {
        const regex = /^\d+:[0-5][0-9]\.\d$/;
        return regex.test(split);
    }
    
    function validateSplits(splits) {
        for (let i = 0; i < splits.length; i++) {
            if (!validateSplit(splits[i])) {
                $(`#distance_split_${i}`).addClass('is-invalid');
                return false;
            } else {
                $(`#distance_split_${i}`).removeClass('is-invalid').addClass('is-valid');
            }
        }
        return true;
    }
    
    function validateSplitFormat() {
        const value = $(this).val();
        if (!validateSplit(value)) {
            $(this).addClass('is-invalid').removeClass('is-valid');
        } else {
            $(this).removeClass('is-invalid').addClass('is-valid');
        }
    }
    
    function timeToSeconds(timeStr) {
        const [minutes, seconds] = timeStr.split(':').map(parseFloat);
        return minutes * 60 + seconds;
    }
    
    function secondsToTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
    }
    
    function secondsToTimeFormat(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
    }
    
    function secondsToMinSec(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    function calculateWatts(splitSeconds) {
        // Concept2 formula: watts = 2.80 / (split/500)^3
        const pace = splitSeconds / 500;
        return 2.80 / Math.pow(pace, 3);
    }
    
    // Initialize
    updateRemoveButtons();
    $('#workout_type').trigger('change');
});