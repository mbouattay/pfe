import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface WelcomeMailOptions {
    to: string;
    email: string;
    password: string;
    name: string;
    role: 'Client' | 'Employé';
}

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly mailerService: MailerService) { }

    async sendWelcomeEmail(options: WelcomeMailOptions): Promise<void> {
        const { to, email, password, name, role } = options;

        const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
          .header p { color: #a0a0c0; margin: 5px 0 0; font-size: 14px; }
          .body { padding: 35px 40px; }
          .body h2 { color: #1a1a2e; font-size: 20px; margin-top: 0; }
          .body p { color: #555; line-height: 1.7; }
          .credentials { background: #f0f4ff; border-left: 4px solid #4f46e5; border-radius: 6px; padding: 18px 24px; margin: 24px 0; }
          .credentials p { margin: 6px 0; font-size: 15px; color: #333; }
          .credentials strong { color: #1a1a2e; }
          .credentials code { font-family: monospace; background: #e8edff; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
          .warning { background: #fff8e1; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 12px 18px; margin: 20px 0; font-size: 13px; color: #78500a; }
          .footer { background: #f8f9fa; text-align: center; padding: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Duality Agency</h1>
            <p>Votre compte a été créé</p>
          </div>
          <div class="body">
            <h2>Bienvenue, ${name} 👋</h2>
            <p>Votre compte <strong>${role}</strong> sur la plateforme <strong>Duality Agency</strong> vient d'être créé. Voici vos identifiants de connexion :</p>
            <div class="credentials">
              <p>📧 <strong>Email :</strong> <code>${email}</code></p>
              <p>🔑 <strong>Mot de passe :</strong> <code>${password}</code></p>
            </div>
            <div class="warning">
              ⚠️ <strong>Sécurité :</strong> Nous vous recommandons de changer votre mot de passe dès votre première connexion.
            </div>
            <p>Si vous n'êtes pas à l'origine de cette demande, contactez immédiatement notre support.</p>
            <p>Cordialement,<br/><strong>L'équipe Duality Agency</strong></p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Duality Agency — Tous droits réservés
          </div>
        </div>
      </body>
      </html>
    `;

        try {
            await this.mailerService.sendMail({
                to,
                subject: `🎉 Bienvenue sur Duality Agency — Vos identifiants`,
                html,
            });
            this.logger.log(`Email de bienvenue envoyé à ${to}`);
        } catch (error) {
            this.logger.error(`Échec envoi email à ${to}: ${error.message}`);
            // On ne bloque pas la création du compte si l'email échoue
        }
    }
}
