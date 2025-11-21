## 📚 Content Management Guide

**👩‍🏫 FOR TEACHERS AND EDUCATORS**

This guide is for teachers, content creators, and educators who want to add or modify physics topics, learning objectives, and revision resources. **No coding experience required** - all content is managed through Excel or Google Sheets.

> **👨‍💻 Developers:** Looking for technical implementation details? See **[DATA_ARCHITECTURE.md](DATA_ARCHITECTURE.md)** for the technical guide.

### Overview: How Content Works

The Physics Audit Tool stores all content in **CSV files** (spreadsheet format) that you can edit using Excel or Google Sheets:

```
Excel/Google Sheets → Export as CSV → App loads the content → Students see it in browser
```

**What you can do:**
- ✅ Add new physics topics and learning objectives
- ✅ Organize topics into papers (Paper 1, 2, 3)
- ✅ Add revision resources (videos, notes, simulations, practice questions)
- ✅ Update existing content anytime
- ✅ All editing happens in Excel - no coding needed!

---

### CSV File Structure

The app uses **16 CSV files** organized in the `resources/` directory:

#### 1. Subject Cards (10 files) - `resources/subject-cards/`

These define the physics topics that students can rate their confidence on.

**Files:**
- `measurements.csv` - 3.1 Measurements and errors
- `particles.csv` - 3.2 Particles & Radiation
- `waves.csv` - 3.3 Waves
- `mechanics.csv` - 3.4 Mechanics & Materials
- `electricity.csv` - 3.5 Electricity
- `periodic-motion.csv` - 3.6.1 Periodic Motion
- `thermal.csv` - 3.6.2 Thermal Physics
- `fields.csv` - 3.7a G and E Fields
- `magnetic-fields.csv` - 3.7b Magnetic Fields
- `nuclear.csv` - 3.8 Nuclear Physics

**CSV Structure:**
```csv
section_id,topic_id,section_name,section_title,section_paper,section_icon,revision_section_title,topic_title,topic_prompt,learning_objectives,examples
3.1.1,3.1.1a,measurements_errors,3.1a Measurements and their errors,Paper 1,settings,SI Units and Measurements,Fundamental (base) units,Can you recall...,State the 7 fundamental SI units|Match each unit...,Mass (kg), Length (m)|Temperature (K)...
```

**Column Definitions:**

| Column | Purpose | Example | Notes |
|--------|---------|---------|-------|
| `section_id` | Revision section for color coding | `3.1.1`, `3.1.2` | Groups topics for revision and colors |
| `topic_id` | Unique identifier for the topic | `3.1.1a` | Must be unique across all files |
| `section_name` | Internal key for grouping topics | `measurements_errors` | Used in code, don't change existing values |
| `section_title` | Display name for the section | `3.1a Measurements and their errors` | Shown in UI |
| `section_paper` | Which exam paper | `Paper 1`, `Paper 2`, or `Paper 3` | Used for filtering |
| `section_icon` | Lucide icon name | `settings`, `atom`, `waves`, etc. | See [Lucide Icons](https://lucide.dev/) |
| `revision_section_title` | Display name for revision group | `SI Units and Measurements` | Shown when revising topics |
| `topic_title` | Short title for the topic | `Fundamental (base) units` | Shown on topic card |
| `topic_prompt` | Question to assess understanding | `Can you recall and state the 7 fundamental SI units...` | Helps students assess confidence |
| `learning_objectives` | Pipe-separated list of objectives | `State the 7 fundamental SI units\|Match each unit...` | Split by `\|` character |
| `examples` | Pipe-separated list of examples | `Mass (kg), Length (m)\|Temperature (K)...` | Split by `\|` character |

**Important Notes:**
- Use `|` (pipe) to separate multiple learning objectives or examples
- Each topic must have a unique `topic_id`
- `section_name` is a **key** - it must match entries in `groups.csv`
- Keep `section_name` consistent across files (e.g., all kinematics topics use `motion_kinematics`)

#### 2. Groups Configuration - `resources/groups.csv`

This file defines how sections are organized into groups in the main menu.

**CSV Structure:**
```csv
paper,order,type,group_title,icon,section_name
Paper 1,1,group,3.1 Measurements and their errors,settings,measurements_errors
Paper 1,1,group,3.1 Measurements and their errors,settings,number_work
Paper 1,2,group,3.2 Particles & Radiation,atom,atomic_structure
Paper 1,6,single,,,circular_motion
All Topics,1,group,3.1 Measurements and their errors,settings,measurements_errors
```

**Column Definitions:**

| Column | Purpose | Example | Notes |
|--------|---------|---------|-------|
| `paper` | Which view mode | `Paper 1`, `Paper 2`, `Paper 3`, or `All Topics` | Controls where group appears |
| `order` | Display order | `1`, `2`, `3`... | Groups are sorted by this number |
| `type` | Group type | `group` or `single` | `group` = collapsible section, `single` = standalone |
| `group_title` | Group display name | `3.1 Measurements and their errors` | Shown as card title in main menu |
| `icon` | Lucide icon name | `settings`, `atom`, `waves` | Shown on group card |
| `section_name` | Section key to include | `measurements_errors` | Must match `section_name` in subject CSVs |

**How Grouping Works:**
- Multiple rows with same `paper`, `order`, and `group_title` form one group
- `section_name` values are collected into an array for that group
- Example: "3.1 Measurements and their errors" contains `measurements_errors` AND `number_work`

**Single Sections:**
- Use `type = single` for sections that don't need grouping
- Leave `group_title` and `icon` blank
- Example: `circular_motion` appears standalone in Paper 1

#### 3. Revision Resources (5 files) - `resources/revision/`

These provide study materials for each topic.

##### `videos.csv`
```csv
section_id,title,description,url,duration,difficulty,provider
3.1.1,Introduction to SI Units,Overview of base units,https://youtube.com/...,10:30,Foundation,YouTube
```

##### `notes.csv`
```csv
section_id,title,description,url,type,pages,difficulty
3.1.1,SI Units Summary,Concise reference sheet,https://example.com/notes.pdf,PDF,2,Foundation
```

##### `simulations.csv`
```csv
section_id,title,description,url,provider,interactivity,difficulty
3.1.1,Unit Converter,Interactive unit conversion,https://phet.colorado.edu/...,PhET,High,Foundation
```

##### `questions.csv`
```csv
section_id,title,description,url,type,question_count,difficulty,has_answers
3.1.1,SI Units Practice,10 multiple choice questions,https://example.com/quiz.pdf,Multiple Choice,10,Foundation,TRUE
```

##### `revisionsections.csv`
```csv
section_id,title,notes_html,key_formulas,common_mistakes
3.1.1,SI Units and Measurements,<h2>Base Units</h2><p>There are 7...</p>,F = ma|E = mc²,Don't confuse mass and weight|Remember units
```

**Column Notes:**
- `section_id` links resources to topics (e.g., `3.1.1` links to topics `3.1.1a`, `3.1.1b`)
- `difficulty` can be: `Foundation`, `Intermediate`, or `Advanced`
- `has_answers` for questions: `TRUE` or `FALSE`
- `notes_html` supports full HTML with tags like `<h2>`, `<p>`, `<strong>`, `<ul>`, `<li>`
- Use `|` (pipe) to separate multiple formulas or mistakes

---

### Step-by-Step: Adding New Content

#### Adding a New Topic

1. **Choose the appropriate subject CSV file**
   - Open the file in Excel (e.g., `mechanics.csv` for dynamics topics)

2. **Add a new row with these columns:**
   - `section_id`: Revision section identifier (e.g., `3.4.1`) - groups topics for color coding
   - `topic_id`: Create unique ID (e.g., `3.4.1.9a` - follows spec numbering)
   - `section_name`: Use existing key (e.g., `mechanics_dynamics`) or create new one
   - `section_title`: Display name (e.g., `3.4.1 Forces and Motion`)
   - `section_paper`: `Paper 1` or `Paper 2`
   - `section_icon`: Icon name from [Lucide](https://lucide.dev/) (e.g., `target`)
   - `revision_section_title`: Display name for revision group (e.g., `Forces and Newton's Laws`)
   - `topic_title`: Short topic name (e.g., `Newton's Third Law`)
   - `topic_prompt`: Self-assessment question starting with "Can you..."
   - `learning_objectives`: Separate multiple items with `|`
   - `examples`: Separate multiple items with `|`

3. **Save as CSV**
   - File → Save As → CSV (Comma delimited) (*.csv)
   - **Important**: Use UTF-8 encoding if prompted

4. **If using a NEW section_name:**
   - Add it to `groups.csv` (see "Adding a New Group Section" below)

#### Adding a New Group Section

1. **Open `resources/groups.csv` in Excel**

2. **Decide where it should appear:**
   - Paper 1, Paper 2, or All Topics (or multiple)

3. **Add row(s) for each appearance:**
   ```csv
   Paper 1,7,group,3.9 New Topic Area,atom,new_section_name
   All Topics,11,group,3.9 New Topic Area,atom,new_section_name
   ```

4. **If the group contains multiple sections:**
   - Add one row per section with SAME `paper`, `order`, and `group_title`
   ```csv
   Paper 1,7,group,3.9 New Topic Area,atom,section_one
   Paper 1,7,group,3.9 New Topic Area,atom,section_two
   ```

5. **Save as CSV**

#### Adding Revision Resources

1. **Determine the section_id**
   - Look at `topic_id` values (e.g., `3.1.1a`, `3.1.1b`)
   - Remove letter suffix to get section_id (e.g., `3.1.1`)

2. **Open appropriate resource file:**
   - `videos.csv` for YouTube/video links
   - `notes.csv` for PDFs/documents
   - `simulations.csv` for interactive tools
   - `questions.csv` for practice problems
   - `revisionsections.csv` for summary content

3. **Add new row with all required columns**
   - Make sure `section_id` matches your topics
   - Use descriptive `title` and `description`
   - Test URLs work before adding

4. **Save as CSV**

#### Setting Up Paper 3 Content

The app has full Paper 3 support in the UI (button, navigation, filtering), but **Paper 3 data must be added manually** to CSV files.

**Current Status:**
- ✅ Paper 3 button exists in sidebar
- ✅ Paper 3 filtering logic implemented
- ❌ No Paper 3 content in CSV files (needs to be added)

**Quick Setup Guide:**

**Step 1: Add Paper 3 sections to groups.csv**

Open `resources/groups.csv` and add Paper 3 rows. Insert them after Paper 2 (currently line 32) and before "All Topics" section (currently line 33).

**Example Paper 3 structure:**
```csv
Paper 3,1,group,3.9 Astrophysics,star,stellar_classification
Paper 3,1,group,3.9 Astrophysics,star,cosmology_universe
Paper 3,2,group,3.10 Medical Physics,heart,medical_imaging
Paper 3,2,group,3.10 Medical Physics,heart,radiation_therapy
Paper 3,3,group,3.11 Engineering Physics,cpu,materials_engineering
Paper 3,3,group,3.11 Engineering Physics,cpu,rotational_dynamics
```

**Column meanings:**
- `paper`: Must be exactly `"Paper 3"`
- `order`: Group number (1, 2, 3...) determines display order
- `type`: Either `"group"` (has multiple sections) or `"single"` (standalone)
- `group_title`: Display name shown in sidebar (e.g., "3.9 Astrophysics")
- `icon`: Lucide icon name (browse at https://lucide.dev/)
  - Common choices: `star`, `heart`, `cpu`, `telescope`, `microscope`, `waves`, `disc`
- `section_name`: Internal key linking to topic data (e.g., `stellar_classification`)
  - **IMPORTANT**: Must match `section_name` in subject CSV files

**Step 2: Create topic data in subject CSV files**

**Option A: Create new CSV files** (recommended for Paper 3)

1. Create `resources/subject-cards/astrophysics.csv`
2. Create `resources/subject-cards/medical-physics.csv`
3. Create `resources/subject-cards/engineering-physics.csv`

**CSV Structure (same as existing files):**
```csv
section_id,topic_id,section_name,section_title,section_paper,section_icon,revision_section_title,topic_title,topic_prompt,learning_objectives,examples
```

**Example row for Paper 3 Astrophysics:**
```csv
3.9.1.1,3.9.1.1a,stellar_classification,3.9.1 Stars,Paper 3,star,Stellar Classification,Hertzsprung-Russell diagrams,"Can you interpret an H-R diagram and identify the main sequence, giants, and white dwarfs?",Interpret H-R diagrams|Identify stellar classes|Understand luminosity vs temperature|Calculate absolute magnitude,Main sequence: hydrogen fusion|Giants: expanded outer layers|White dwarfs: collapsed cores|Supergiants: massive evolved stars
```

**Key points for Paper 3 topics:**
- `section_id`: Use 3.9.x for Astrophysics, 3.10.x for Medical, 3.11.x for Engineering
- `topic_id`: Must be globally unique (include letter suffix: a, b, c...)
- `section_name`: Must match `groups.csv` (e.g., `stellar_classification`)
- `section_paper`: Must be exactly `"Paper 3"`
- `section_icon`: Choose appropriate Lucide icon
- Use `|` (pipe) to separate multiple learning objectives and examples

**Option B: Add to existing CSV files** (if topics fit existing categories)

You can add Paper 3 topics to existing CSV files like `fields.csv` or `mechanics.csv` if they're extensions of Paper 1/2 content. Just set `section_paper` to `"Paper 3"`.

**Step 3: Developer task (if you created new CSV files)**

⚠️ **For developers only:** If you created new CSV files (Option A above), they need to be registered in the code. See `docs/TODO.md` under "Content Development → Paper 3 Support" for instructions.

**Note:** If you used Option B (adding to existing files), no developer work is needed - skip to Step 4!

**Step 4: Test your changes**

1. Hard refresh browser (Ctrl+Shift+R)
2. Click Paper 3 button in sidebar
3. Verify your groups and topics appear
4. Check console (F12) for any CSV parsing errors

**Paper 3 Template Files:**

**astrophysics.csv starter:**
```csv
section_id,topic_id,section_name,section_title,section_paper,section_icon,revision_section_title,topic_title,topic_prompt,learning_objectives,examples
3.9.1.1,3.9.1.1a,stellar_classification,3.9.1 Stars,Paper 3,star,Stars,Stellar types,"Can you classify stars using the H-R diagram?",Understand H-R diagram|Classify stellar types|Calculate luminosity,Main sequence|Red giants|White dwarfs
3.9.2.1,3.9.2.1a,cosmology_universe,3.9.2 Cosmology,Paper 3,star,Cosmology,Big Bang theory,"Can you describe evidence for the Big Bang?",Explain cosmic microwave background|Calculate Hubble constant|Understand universe expansion,CMB radiation|Redshift|Hubble's law
```

**medical-physics.csv starter:**
```csv
section_id,topic_id,section_name,section_title,section_paper,section_icon,revision_section_title,topic_title,topic_prompt,learning_objectives,examples
3.10.1.1,3.10.1.1a,medical_imaging,3.10.1 Medical Imaging,Paper 3,heart,Medical Imaging,X-ray imaging,"Can you explain how X-rays are used in medical imaging?",Understand X-ray production|Calculate attenuation|Explain contrast media,CT scans|Radiography|Image enhancement
3.10.2.1,3.10.2.1a,radiation_therapy,3.10.2 Radiation Therapy,Paper 3,heart,Radiation,Radiotherapy,"Can you explain the use of radiation in cancer treatment?",Calculate absorbed dose|Understand quality factor|Explain treatment planning,Linear accelerators|Gamma rays|Dose distribution
```

**Validation Checklist:**
- ✅ `section_name` in groups.csv matches subject CSV files
- ✅ `section_paper` is exactly `"Paper 3"` in all Paper 3 topics
- ✅ `topic_id` values are unique across ALL CSV files
- ✅ New CSV files are registered in `unified-csv-loader.js`
- ✅ Pipe separators (`|`) used for multi-value fields
- ✅ No trailing spaces in key fields
- ✅ UTF-8 encoding when saving CSV files

**Common Issues:**
- **Paper 3 button shows but no content**: Check groups.csv has Paper 3 rows
- **Topics don't appear**: Verify `section_name` matches between groups.csv and subject CSVs
- **CSV parsing error**: Check for missing commas, unmatched quotes, or incorrect encoding
- **Topics appear in wrong paper**: Verify `section_paper` column is exactly `"Paper 3"`

---

### Best Practices

#### Excel Tips

1. **Use Excel Tables** (Ctrl+T)
   - Makes it easier to add rows
   - Auto-extends formulas
   - Better visual organization

2. **Freeze Header Row** (View → Freeze Panes → Freeze Top Row)
   - Keep column names visible while scrolling

3. **Use Find & Replace** (Ctrl+H)
   - Bulk update section names
   - Fix formatting issues quickly

4. **Data Validation**
   - Create dropdown lists for `section_paper` (Paper 1, Paper 2, Paper 3)
   - Create dropdown for `difficulty` (Foundation, Intermediate, Advanced)
   - Prevents typos that break filtering

5. **Comments** (Right-click cell → Insert Comment)
   - Add notes about changes or reasoning
   - Track TODOs for incomplete content

#### CSV Export Checklist

Before exporting to CSV:
- ✅ **Check for commas** in text fields (Excel handles this with quotes)
- ✅ **Remove extra blank rows** at the end
- ✅ **Verify pipe separators** (`|`) are correct in multi-value fields
- ✅ **Test URLs** are complete and working
- ✅ **Check encoding** - Use UTF-8 to preserve special characters
- ✅ **No trailing spaces** in key fields like `section_name`

#### Content Quality Guidelines

**Topic Prompts:**
- Start with "Can you..." or "Do you understand..."
- Be specific about what knowledge is tested
- Include context where helpful
- Example: "Can you derive the equations of motion using calculus and apply them to solve kinematics problems?"

**Learning Objectives:**
- Use action verbs: State, Describe, Calculate, Derive, Apply, Explain
- One objective per pipe-separated item
- Progress from simple to complex
- Example: `State Newton's laws|Apply F=ma to solve problems|Derive equations for constant acceleration`

**Examples:**
- Give concrete, specific instances
- Use numbers and units where appropriate
- Show range of difficulty
- Example: `F = 50 N applied to 10 kg mass|Rocket propulsion in space|Car braking calculations`

#### Maintaining Consistency

**Section Names** (Internal Keys):
- Use lowercase
- Use underscores for spaces: `mechanics_dynamics`
- Be descriptive but concise
- **Don't change existing ones** - breaks links

**Section Titles** (Display Names):
- Use proper capitalization
- Include spec reference: `3.4.1 Kinematics`
- Be consistent with specification document

**Topic IDs:**
- Follow specification numbering: `3.4.1.2a`
- Add letters for sub-topics: `a`, `b`, `c`
- Must be globally unique

**Icons:**
- Use consistent icons for related content
- Common choices:
  - `settings` - measurement, tools
  - `atom` - particles, quantum
  - `waves` - oscillations, waves
  - `target` - mechanics, motion
  - `zap` - electricity, energy
  - `globe` - fields, forces
  - `shield` - nuclear, safety

---

### Testing Your Changes

After updating CSV files:

1. **Refresh the browser** (Ctrl+R or F5)
   - App loads CSVs on startup
   - Check console for errors

2. **Check the console** (F12)
   - Look for "✅ CSV data loaded successfully"
   - Check for "✅ Loaded groups from CSV"
   - Watch for parsing errors

3. **Test in the UI:**
   - Navigate to affected sections
   - Verify topics appear correctly
   - Check resource links work
   - Test in both Paper mode and Spec mode

4. **Common Issues:**
   - **Blank screen**: Check CSV syntax, missing files
   - **Missing sections**: Check `section_name` matches in subject CSVs and `groups.csv`
   - **Broken grouping**: Check `order`, `paper`, and `group_title` are consistent
   - **Resources not showing**: Verify `section_id` matches topic ID prefix

---

### Advanced: Optimizing Load Time

For production or frequent use, convert CSVs to optimized JSON v2.0:

1. **Open CSV converter** (Settings → Admin → CSV to JSON Converter, or `tools/csv-converter.html`, or via `tools/index.html` dashboard)

2. **Choose mode**:
   - **Server Mode**: Automatically fetches all 16 CSV files from your web server
   - **Local Mode**: Drag & drop or select all 16 CSV files:
     - 10 subject cards
     - 5 revision resources
     - 1 groups.csv

3. **Click "Convert" and download**

4. **Save as `resources/combined-data.json`**

5. **Reload app** → 10x faster loading (200ms vs 2-3 seconds)

**JSON v2.0 Features:**
- ✅ Includes groups configuration (no groups.csv HTTP request)
- ✅ Pre-processed revision mappings
- ✅ Version tracking and metadata
- ✅ Graceful degradation for old JSON files

**Note:** JSON doesn't auto-update when CSVs change. Re-run converter after CSV edits.

---

### Understanding Colors and Grouping (Optional)

**How topic colors work:**

When you give topics the same `section_id` (e.g., `3.1.1`), they automatically:
- Get grouped together in revision mode
- Share the same color bar at the top of each card
- Appear under the same `revision_section_title`

**Example:**
```csv
section_id,topic_id,revision_section_title,...
3.1.1,3.1.1a,SI Units and Measurements,...  ← Same section_id = same color group
3.1.1,3.1.1b,SI Units and Measurements,...  ← Same section_id = same color group
3.1.2,3.1.2a,Errors and Uncertainties,...   ← Different section_id = different color
```

This makes it easy for students to visually identify related topics. You don't need to manage colors yourself - the app automatically assigns them based on `section_id`.

---

### Troubleshooting CSV Issues

#### "Failed to load CSV" Error
- **Check file exists** in correct directory
- **Check filename** matches exactly (case-sensitive on some servers)
- **Check file encoding** - should be UTF-8
- **Check for BOM** (Byte Order Mark) - can cause parsing errors

#### Topics Not Appearing
- **Check `section_name`** matches exactly in subject CSV and `groups.csv`
- **Check `topic_id`** is unique
- **Check no missing required columns**

#### Resources Not Loading
- **Check `section_id`** matches topic ID prefix
  - Topics: `3.1.1a`, `3.1.1b` → Resources: `3.1.1`
- **Check URL** is complete including `https://`
- **Check for typos** in section_id

#### Groups Not Showing
- **Check `order` column** is a number
- **Check `paper` value** is exactly `Paper 1`, `Paper 2`, or `All Topics`
- **Check `type`** is exactly `group` or `single`

#### Parsing Errors
- **Check for unescaped commas** in text (Excel should handle with quotes)
- **Check for unescaped quotes** in text (Excel doubles them: `""`)
- **Check pipe separators** (`|`) are used correctly
- **Check no extra blank rows** at end of file

---

