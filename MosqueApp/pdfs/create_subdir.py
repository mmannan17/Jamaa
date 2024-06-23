import os


states = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
          "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
          "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
          "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New_Hampshire", 
          "New_Jersey", "New_Mexico", "New_York", "North_Carolina", "North_Dakota", "Ohio", 
          "Oklahoma", "Oregon", "Pennsylvania", "Rhode_Island", "South_Carolina", "South_Dakota", 
          "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West_Virginia", 
          "Wisconsin", "Wyoming", "DC"]

# Base directory for storing PDFs
base_dir = 'states/'

# Create subdirectories for each state
for state in states:
    state_dir = os.path.join(base_dir, state)
    if not os.path.exists(state_dir):
        os.makedirs(state_dir)
        print(f"Created directory for {state}")

print("All state directories have been created.")