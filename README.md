# AWS SSO Role Manager

A centralized web application for managing AWS SSO roles and permission sets across multiple AWS accounts in your organization. This tool allows you to define custom IAM roles and SSO permission sets, track changes, and deploy them to your AWS accounts from a single interface.

## Features

- **AWS Account Management**: View and manage all accounts in your AWS Organization
- **IAM Role Management**: Create, update, and deploy custom IAM roles with trust policies
- **SSO Permission Set Management**: Define and manage AWS SSO permission sets with managed policies
- **Deployment History**: Track all deployments with detailed logs and status
- **Multi-user Access Control**: Role-based access control with Admin, Editor, and Viewer roles
- **Change History**: Track changes to roles and permission sets over time
- **Compliance Tracking**: Monitor compliance status across accounts


## Technology Stack

- **Frontend**: Next.js 13 with App Router, React 18, Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Authentication**: NextAuth.js with Email/Password authentication
- **Database**: PostgreSQL with Prisma ORM
- **AWS Integration**: AWS SDK v3 with SSO credentials


## Prerequisites

- Node.js 18.x or later
- PostgreSQL database
- AWS Organization with AWS SSO enabled
- AWS Identity Center (SSO) properly configured
- AWS CLI configured with SSO access


## Installation

1. Clone the repository:


```shellscript
git clone https://github.com/yourusername/aws-sso-manager.git
cd aws-sso-manager
```

2. Install dependencies:


```shellscript
npm install
```

3. Set up environment variables by creating a `.env` file:


```plaintext
DATABASE_URL="postgresql://username:password@localhost:5432/aws_sso_manager"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# AWS Configuration
AWS_REGION="us-east-1"
AWS_ROLE_ARN="arn:aws:iam::ACCOUNT_ID:role/YourRole" # Optional
```

4. Set up the database:


```shellscript
npx prisma migrate dev
```

5. Seed the admin user:


```shellscript
npm run seed-admin
```

This creates an admin user with the following credentials:

- Email: [admin@example.com](mailto:admin@example.com)
- Password: Admin123!


6. Start the development server:


```shellscript
npm run dev
```

## AWS Configuration

### Required AWS Permissions

The AWS role or SSO user used by this application needs the following permissions:

1. **IAM permissions** to create/update roles across accounts
2. **Organizations permissions** to list accounts
3. **SSO Admin permissions** to manage permission sets


### Using with AWS SSO

This application is designed to work with AWS SSO credentials. To use it:

1. Configure AWS CLI with your SSO profile:


```shellscript
aws configure sso --profile default
```

2. Log in to SSO:


```shellscript
aws sso login --profile default
```

3. Run the application, which will use your SSO credentials to access AWS resources


### Using with a Role

Alternatively, you can specify an IAM role to assume by setting the `AWS_ROLE_ARN` environment variable. The role should have the necessary permissions and trust policy to allow assumption by the identity running the application.

## Usage

After installation, you can access the application at `http://localhost:3000`.

1. **Login** using the admin credentials
2. **Configure Roles** by creating IAM roles with appropriate trust policies
3. **Create Permission Sets** with the required AWS managed policies and inline policies
4. **Assign Permission Sets** to your AWS accounts
5. **Deploy** the roles and permission sets to your accounts
6. **Monitor** the deployment status and account compliance


## Architecture

The application follows a modern Next.js 13 architecture with server components, client components, and server actions:

- **Server Components** - For data fetching and server-side operations
- **Client Components** - For interactive UI elements
- **API Routes** - For authenticated server-side interactions with AWS
- **Server Actions** - For form submissions and protected operations
- **Database** - PostgreSQL for storing application state and tracking changes


All AWS operations are performed server-side to securely manage credentials.

## Project Structure

```plaintext
app/                # Next.js app router structure
  api/              # API routes
  login/            # Login page
  roles/            # Roles management page
  permission-sets/  # Permission sets management page
  deployments/      # Deployments page
  users/            # User management page
components/         # Reusable React components
lib/                # Utility functions and libraries
  aws-client.ts     # AWS SDK client setup
  auth.ts           # Authentication helpers
  prisma.ts         # Database client
prisma/             # Database schema and migrations
scripts/            # Helper scripts
  seed-admin.ts     # Admin user seeding script
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Security Notes

- Never commit your AWS credentials or environment variables to source control
- Ensure proper IAM permissions are set on the AWS role used by this application
- Use SSO whenever possible instead of long-lived credentials
- Regularly rotate the NEXTAUTH_SECRET and admin password