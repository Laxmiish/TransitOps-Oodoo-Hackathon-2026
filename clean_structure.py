import os
import shutil

# Target directory
frontend_dir = "frontend"

# List of files and folders that belong in the frontend
files_to_move = [
    "src",
    "public",
    "index.html",
    "package.json",
    "package-lock.json",
    "vite.config.js",
    ".env",
    ".env.example",
    ".oxlintrc.json"
]

def main():
    if not os.path.exists(frontend_dir):
        os.makedirs(frontend_dir)
        print(f"Created {frontend_dir} folder.")

    for item in files_to_move:
        if os.path.exists(item):
            destination = os.path.join(frontend_dir, item)
            
            # If the destination already exists (e.g. they ran `create-react-app frontend`), 
            # we don't want to blindly overwrite unless we're sure.
            if os.path.exists(destination):
                print(f"Warning: {destination} already exists! Skipping {item}.")
                continue
                
            shutil.move(item, destination)
            print(f"Moved {item} -> {destination}")
        else:
            print(f"Skipped {item} (not found in root)")

    print("Cleanup complete!")

if __name__ == "__main__":
    main()
