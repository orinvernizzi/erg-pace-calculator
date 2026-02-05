from flask import Flask, render_template, request, jsonify
import math

app = Flask(__name__)

def time_to_seconds(time_str):
    """we convert a split time string (m:ss.s) to total seconds like 1:45.5"""
    try:
        if ':' in time_str:
            minutes, seconds = map(float, time_str.split(":"))
            return minutes * 60 + seconds
        else:
            return float(time_str)
    except:
        return 0

def seconds_to_time(seconds):
    """here we just put the seconds into m:ss.s format."""
    try:
        minutes = int(seconds // 60)
        sec = seconds % 60
        return f"{minutes}:{sec:04.1f}"
    except:
        return "0:00.0"

@app.route('/')
def index():
    """we render the main form which is index.html"""
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    """we calculate pace and time from form data from what the user submitted."""
    try:
        # Get form data
        total_meters = int(request.form.get('total_meters', 2000))
        segment_length = int(request.form.get('segment_length', 500))
        
        # Validate segment length divides evenly
        if total_meters % segment_length != 0:
            return jsonify({
                'error': f'{segment_length}m does not divide {total_meters}m evenly.'
            })
        
        num_segments = total_meters // segment_length
        
        # Get all split values
        splits = []
        for i in range(num_segments):
            split_key = f'split_{i}'
            split_value = request.form.get(split_key, '0:00.0')
            splits.append(split_value)
        
        # Calculate average split
        split_seconds = [time_to_seconds(split) for split in splits]
        avg_split_seconds = sum(split_seconds) / len(split_seconds) if split_seconds else 0
        avg_split = seconds_to_time(avg_split_seconds)
        
        # Calculate total time
        segment_times = [seconds * (segment_length / 500) for seconds in split_seconds]
        total_time_seconds = sum(segment_times)
        total_time = seconds_to_time(total_time_seconds)
        
        # Calculate cumulative times for each segment
        segment_breakdown = []
        cumulative_time = 0
        
        for i in range(num_segments):
            segment_end = (i + 1) * segment_length
            segment_time = segment_times[i]
            cumulative_time += segment_time
            
            segment_breakdown.append({
                'segment': i + 1,
                'target_split': splits[i],
                'segment_time': seconds_to_time(segment_time),
                'cumulative_time': seconds_to_time(cumulative_time),
                'distance': segment_end
            })
        
        # Return results as JSON
        return jsonify({
            'success': True,
            'total_meters': total_meters,
            'segment_length': segment_length,
            'num_segments': num_segments,
            'average_split': avg_split,
            'total_time': total_time,
            'segment_breakdown': segment_breakdown
        })
        
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/update_segments', methods=['POST'])
def update_segments():
    """Dynamically update number of split inputs when distance/segment changes."""
    try:
        total_meters = int(request.form.get('total_meters', 2000))
        segment_length = int(request.form.get('segment_length', 500))
        
        if segment_length <= 0:
            return jsonify({'error': 'Segment length must be positive.'})
        
        if total_meters % segment_length != 0:
            return jsonify({'error': f'{segment_length}m does not divide {total_meters}m evenly.'})
        
        num_segments = total_meters // segment_length
        
        # Generate HTML for split inputs
        split_inputs_html = ""
        for i in range(num_segments):
            split_inputs_html += f'''
            <div class="form-group">
                <label for="split_{i}">Segment {i+1}/{num_segments} ({segment_length}m):</label>
                <input type="text" id="split_{i}" name="split_{i}" 
                       value="1:45.0" class="form-control split-input" 
                       placeholder="m:ss.s" required>
                <small class="form-text text-muted">Target 500m split pace</small>
            </div>
            '''
        
        return jsonify({
            'success': True,
            'num_segments': num_segments,
            'split_inputs_html': split_inputs_html
        })
        
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)